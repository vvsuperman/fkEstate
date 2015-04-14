require! fs
require! os
require! path
/**
 * require a library in a universal way
 */
let amd-require(local-name, amd-name, global-name)
  let mutable library = require local-name
  if library
    library
  else if is-function! define and define.amd
    real-require amd-name
  else if is-object! root
    library := root[global-name]
    if not library
      throw Error "$global-name must be available before EGS is loaded"
    library
  else
    throw Error "Unable to detect runtime environment of EGS"
let egs-runtime = amd-require './runtime', 'egs-runtime', 'EGSRuntime'
let {Package, EGSError, guess-filepath, helper-names: standard-helper-names, make-template, make-helpers-factory, version: egs-runtime-version} = egs-runtime
if egs-runtime-version != __VERSION__
  throw Error "EGS and its runtime must have the same version: '$(__VERSION__)' vs. '$egs-runtime-version'"
let gorillascript = amd-require 'gorillascript', 'gorillascript', 'GorillaScript'

const DEBUG = false
const DISABLE_TYPE_CHECKING = not DEBUG

let memoize(mutable func)
  let mutable result = void
  #
    if func
      result := func()
      func := null
    result

/**
 * Parse the macros from the built-in egs-prelude.gs, return the macros to be
 * used in further compilation.
 */
let [get-prelude-macros, with-egs-prelude] = do
  let mutable egs-prelude-code = void
  let mutable get-egs-prelude-p = memoize promise! #*
    let text = egs-prelude-code or yield to-promise! fs.read-file "$__dirname/../src/egs-prelude.gs", "utf8"
    let result = yield gorillascript.parse text
    result.macros
  let prelude-path-cache = {}
  
  [
    #(prelude-path as String|null)
      let egs-prelude-p = get-egs-prelude-p()
      if not prelude-path
        egs-prelude-p
      else
        prelude-path-cache[prelude-path] or= promise!
          let egs-prelude = yield egs-prelude-p
          let text = yield to-promise! fs.read-file prelude-path, "utf8"
          let result = yield gorillascript.parse text, { macros: egs-prelude }
          result.macros
    #(code as String)
      egs-prelude-code := code
      this
  ]

/**
 * The final AST from the GorillaScript compiler will be piped through this
 * function, allowing for various optimizations.
 */
let get-ast-pipe = do
  let ast = gorillascript.AST
  /**
   * Whether the node is a specific ident call
   */
  let is-call(node, function-name)
    if node instanceof ast.Call
      let {func} = node
      func instanceof ast.Ident and func.name == function-name
  /**
   * Whether the node is a specific method call on the context
   */
  let is-context-call(node, function-name)
    if node instanceof ast.Call
      let {func} = node
      if func instanceof ast.Binary and func.op == "."
        let {left, right} = func
        return left instanceof ast.Ident and left.name == "context" and right.is-const() and right.const-value() == function-name
    false
  /**
   * Convert `write.call(any, ...args)` to `write(...args)` and `write.apply(any, args)` to `write(args[0])`
   */
  let convert-write-call-to-write(node)
    if node instanceof ast.Call
      let func = node.func
      if func instanceof ast.Binary and func.op == "." and func.left instanceof ast.Ident and func.left.name == \write and func.right.is-const()
        switch func.right.const-value()
        case \call
          ast.Block node.pos, [
            node.args[0]
            ast.Call node.pos,
              func.left,
              node.args[1 to -1]
          ]
        case \apply
          ast.Block node.pos, [
            node.args[0]
            if node.args[1].is-noop()
                ast.Call node.pos,
                  func.left
                  [
                    ast.IfExpression node.args[1].pos,
                      ast.Access node.args[1].pos,
                        node.args[1]
                        ast.Const node.args[1], 1
                      ast.Call node.pos,
                        ast.Access node.pos,
                          ast.Ident node.pos, \context
                          ast.Const node.pos, \escape
                        [ast.Access node.args[1].pos,
                          node.args[1]
                          ast.Const node.args[1], 0]
                      ast.Access node.args[1].pos,
                        node.args[1]
                        ast.Const node.args[1], 0
                  ]
            else
              ast.Call node.pos,
                func.left
                [
                  ast.Call node.args[1].pos,
                    ast.Access node.pos,
                      ast.Ident node.pos, \context
                      ast.Const node.args[1].pos, \__maybe-escape
                    [
                      ast.Access node.pos,
                        ast.Ident node.pos, \context
                        ast.Const node.pos, \escape
                      node.args[1]
                    ]
                ]
          ]
        default
          void
  /**
   * Convert `write(value, true)` to `write(context.escape(value))`
   */
  let convert-write-true-to-write-escape(node)
    if is-call(node, \write) and node.args.length == 2 and node.args[1].is-const() and node.args[1].const-value()
      ast.Call node.pos,
        node.func,
        [ast.Call node.pos,
          ast.Access node.pos,
            ast.Ident node.pos, \context
            ast.Const node.pos, \escape
          [node.args[0]]]
  /**
   * Convert `context.escape(context.h(value))` to `value`
   */
  let unwrap-escape-h(node)
    if is-context-call(node, \escape) and node.args.length == 1
      let arg = node.args[0]
      if arg and (is-context-call(arg, \h) or is-context-call(arg, \html)) and arg.args.length == 1
        arg.args[0]
  /**
   * Naively check on whether the node can be numeric, i.e. whether `x + x`
   * would give a number rather than a string.
   */
  let can-be-numeric(node)
    if node.is-const()
      not is-string! node.const-value()
    else if node instanceof ast.Binary
      if node.op == "+"
        can-be-numeric(node.left) and can-be-numeric(node.right)
      else
        true
    else if node instanceof ast.IfExpression
      can-be-numeric(node.when-true) or can-be-numeric(node.when-false)
    else if node instanceofsome [ast.BlockExpression, ast.BlockStatement]
      can-be-numeric(node.body[* - 1])
    else
      not is-context-call(node, \escape)

  /**
   * Convert `write(x); write(y)` to `write("" + x + y)`
   * Convert `if (cond) { write(x); } else { write(y); }` to `write(cond ? x : y)`
   */
  let merge-writes(node)
    if node instanceofsome [ast.BlockExpression, ast.BlockStatement]
      let body = node.body.slice()
      let mutable changed = false
      for subnode, i in body
        let new-subnode = subnode.walk-with-this merge-writes
        body[i] := new-subnode
        if new-subnode != subnode
          changed := true
      let mutable i = 0
      while i < body.length - 1
        let left = body[i]
        let right = body[i + 1]
        if is-call(left, \write) and left.args.length == 1 and is-call(right, \write) and right.args.length == 1
          changed := true
          body.splice i, 2, ast.Call left.pos,
            left.func
            [ast.Binary left.pos,
              if can-be-numeric(left.args[0]) and can-be-numeric(right.args[0])
                ast.Binary left.pos,
                  ast.Const left.pos, ""
                  "+"
                  left.args[0]
              else
                left.args[0]
              "+"
              right.args[0]]
        else
          i += 1
      if changed
        ast.Block(node.pos, body, node.label)
    else if node instanceofsome [ast.IfStatement, ast.IfExpression] and not node.label
      let when-true = node.when-true.walk-with-this merge-writes
      let when-false = node.when-false.walk-with-this merge-writes
      if is-call(when-true, \write) and (is-call(when-false, \write) or when-false.is-noop())
        ast.Call node.pos,
          when-true.func
          [ast.IfExpression node.pos,
            node.test.walk-with-this merge-writes
            when-true.args[0]
            if when-false.is-noop()
              ast.Const when-false.pos, ""
            else
              when-false.args[0]]
  /**
   * Return whether the function contains `context.extends`
   */
  let has-extends(node)
    let FOUND = {}
    try
      node.walk #(subnode)
        if subnode instanceof ast.Func
          subnode
        else if is-context-call subnode, \extends
          throw FOUND
    catch e == FOUND
      return true
    false
  /**
   * remove all `write()` calls within the function.
   */
  let remove-writes-in-function(node)
    if node instanceof ast.Func
      node
    else if is-call node, \write
      ast.Noop node.pos
  /**
   * if `context.extends` is detected within afunction, remove all `write()` calls.
   */
  let remove-writes-after-extends(node)
    if node instanceof ast.Func
      if has-extends node
        node.walk remove-writes-in-function
  /**
   * Convert `write(value)` to `write += value` and `write.apply(any, arr)` to `write += arr[0]`
   */
  let convert-write-to-string-concat(node)
    if is-call node, \write
      ast.Binary(node.pos,
        node.func
        "+="
        node.args[0]).walk convert-write-to-string-concat
  let prepend(left, node)
    if node instanceof ast.Binary and node.op == "+"
      ast.Binary left.pos,
        prepend(left, node.left)
        "+"
        node.right
    else
      ast.Binary left.pos,
        left
        "+"
        node
  /**
   * Convert `write += value; return write;` to `return write + value;`
   */
  let convert-last-write(node)
    if node instanceof ast.BlockStatement
      let last = node.body[* - 1]
      if last instanceof ast.Return and last.node instanceof ast.Ident and last.node.name == \write
        let before-last = node.body[* - 2]
        if before-last and before-last instanceof ast.Binary and before-last.op == "+=" and before-last.left instanceof ast.Ident and before-last.left.name == \write
          ast.BlockStatement node.pos, [
            ...node.body[0 til -2]
            ast.Return before-last.pos,
              prepend before-last.left, before-last.right
          ], node.label
  /**
   * At the top of the generated function is if (context == null) { context = {}; }
   * Since context is guaranteed to exist, we can turn `context == null` into `false`
   */
  let remove-context-null-check(node)
    if node instanceof ast.Binary and node.op == "==" and node.left instanceof ast.Ident and node.left.name == \context and node.right.is-const() and not node.right.const-value()?
      ast.Const node.pos, false

  /**
   * Change `context.key` to `helpers.key` if "key" exists in `helper-names`
   */
  let change-context-to-helpers(helper-names) #(node)
    if node instanceof ast.Binary and node.op == "." and node.left instanceof ast.Ident and node.left.name == \context and node.right.is-const() and node.right.const-value() in helper-names
      ast.Binary node.pos,
        ast.Ident node.left.pos, \helpers
        "."
        node.right

  /**
   * Convert the function like `function (write, context) {}` to `function (write, context, helpers) {}`
   */
  let add-helpers-to-params(node)
    if node instanceof ast.Func and node.params.length == 2 and node.params[0].name == \write and node.params[1].name == \context
      ast.Func node.pos,
        node.name
        [
          node.params[0]
          node.params[1]
          ast.Ident node.pos, \helpers
        ]
        node.variables
        node.body
        node.declarations
  /**
   * Convert a function like `function (write, context, helpers) { ... return { close, iterator, next, throw } }`
   * into `function (write, context, helpers) { ... return { ..., flush } }`
   */
  let add-flush-to-generator-return(node)
    if node instanceof ast.Func and node.params.length == 3 and node.params[0].name == \write and node.params[1].name == \context and node.params[2].name == \helpers and node.body instanceof ast.BlockStatement
      let last-statement = node.body.body[* - 1]
      if last-statement instanceof ast.Return and last-statement.node instanceof ast.Obj
        let pos = last-statement.pos
        ast.Func node.pos,
          node.name
          node.params
          node.variables
          ast.BlockStatement node.body.pos, [
            ...node.body.body[0 til -1]
            ast.Return pos,
              ast.Obj last-statement.node.pos, [
                ...last-statement.node.elements
                ast.Obj.Pair pos, \flush,
                  ast.Func pos,
                    null
                    []
                    [\flushed]
                    ast.Block pos, [
                      ast.Assign pos,
                        ast.Ident pos, \flushed
                        ast.Ident pos, \write
                      ast.Assign pos,
                        ast.Ident pos, \write
                        ast.Const pos, ""
                      ast.Return pos,
                        ast.Ident pos, \flushed
                    ]
              ]
          ]
          node.declarations
  
  let remove-__generator-wrap(node, parent)
    if is-call(node, \__generator)
      let subnode = node.args[0]
      if subnode instanceof ast.Func and subnode.params.length == 3 and subnode.params[0].name == \write and subnode.params[1].name == \context and subnode.params[2].name == \helpers
        subnode
  
  #(helper-names) #(root)
    root
      .walk convert-write-call-to-write
      .walk convert-write-true-to-write-escape
      .walk unwrap-escape-h
      .walk merge-writes
      .walk remove-writes-after-extends
      .walk convert-write-to-string-concat
      .walk convert-last-write
      .walk remove-context-null-check
      .walk change-context-to-helpers(helper-names)
      .walk add-helpers-to-params
      .walk add-flush-to-generator-return
      .walk remove-__generator-wrap

/**
 * Compile a chunk of egs-code into a chunk of JavaScript code.
 */
let compile-code = promise! #(egs-code as String, compile-options as {}, helper-names as [])*
  let macros = yield get-prelude-macros(compile-options.prelude)
  let ast-pipe = get-ast-pipe(helper-names)
  let options = {} <<< compile-options <<< { +embedded, +noindent, macros, prelude: null, ast-pipe }
  let mutable code = void
  let mutable is-generator = false
  try
    code := (yield gorillascript.compile egs-code, options).code
  catch
    options.embedded-generator := true
    is-generator := true
    code := (yield gorillascript.compile egs-code, options).code
  {
    is-generator
    code
  }

let generator-to-promise-with-streaming(generator, stream-send)
  let continuer(verb, arg)
    let item = try
      generator[verb] arg
    catch e
      return __defer.rejected e
    
    if item.done
      __defer.fulfilled item.value
    else
      let text = generator.flush()
      if text
        try
          stream-send text
        catch e
          return __defer.rejected e
      item.value.then callback, errback, true
  let callback(value)
    continuer \send, value
  let errback(value)
    continuer \throw, value
  callback void

/**
 * Compile a chunk of egs-code to a usable function which takes a write
 * function and the context which it uses to override global access.
 */
let compile = promise! #(egs-code as String, compile-options as {}, helper-names as [])* as Promise<Function<Promise, Function, {}>>
  let {is-generator, code} = yield compile-code(egs-code, compile-options, helper-names)
  
  {
    func: if is-generator
      let factory = Function("return $code")()
      let promise-factory = promise! factory
      promise-factory.stream := #(stream-send, ...args)
        let generator = factory@ this, ...args
        if generator.flush
          generator-to-promise-with-streaming generator, stream-send
        else
          __generator-to-promise generator
      promise-factory
    else
      Function("return $code")()
    is-simple: for every special in [\extends, \partial, \block]
      code.index-of("helpers.$special") == -1 and code.index-of("helpers[\"$special\"]") == -1
  }

/**
 * Generate a cache key from the given options. It should only include the
 * relevant parts needed for compilation, i.e. not any context-specific data.
 */
let make-cache-key(options) as String
  """$(options.open or '\0')\0$(options.open-write or '\0')\0$(options.open-comment or '\0')\0$(options.open-literal or '\0')\0$(options.close or '\0')\0$(options.close-write or '\0')\0$(options.close-comment or '\0')\0$(options.close-literal or '\0')\0$(String options.cache)\0$(options.prelude or '\0')"""

let return-same(value) # value

/**
 * Compile a file, see `compile` for more information.
 * If `options.cache` is unset, then every access to the compilation function
 * results in an `fs.stat` to see if the file has changed, recompiling if
 * necessary. It is important to set `options.cache` in production.
 *
 * This does cache on the path and options passed in so that the compilation is
 * shared between any code that asks for a compilation, such as a partial.
 */
let compile-file = do
  let cache = {}
  #(filepath as String, compile-options as {}, helper-names as []) as Function<Promise>
    let inner-cache = cache[filepath] or= {}
    inner-cache[make-cache-key(compile-options) & "\0" & helper-names.join("\0")] or= do
      let recompile-file = promise! #*
        let egs-code = yield to-promise! fs.read-file filepath, "utf8"
        yield compile egs-code, compile-options, helper-names
      if compile-options.cache
        return-same recompile-file()
      else
        let retime = promise! #*
          let stat = yield to-promise! fs.stat filepath
          stat.mtime.get-time()
        let mutable current-compilation-p = recompile-file()
        let mutable current-time-p = retime()
        promise! #*
          let new-time-p = retime()
          if (yield current-time-p) != (yield new-time-p)
            current-compilation-p := recompile-file()
            current-time-p := new-time-p
          yield current-compilation-p

/**
 * Find the filepath of the requested name and return the full filepath and
 * the compiled result.
 */
let find-and-compile-file = promise! #(name as String, from-filepath as String, compile-options = {}, helper-names as [])*
  let filepath = guess-filepath name, from-filepath
  let compiled = yield compile-file(filepath, compile-options, helper-names)()
  { filepath, compiled }

/**
 * Create an options object to be passed to the GorillaScript compiler.
 */
let get-compile-options(options = {})
  {
    options.filename
    embedded-open: options.open
    embedded-open-write: options.open-write
    embedded-open-comment: options.open-comment
    embedded-open-literal: options.open-literal
    embedded-close: options.close
    embedded-close-write: options.close-write
    embedded-close-comment: options.close-comment
    embedded-close-literal: options.close-literal
    options.prelude
    options.cache
    options.undefined-name
    options.uglify
  }

/**
 * Retrieve only the valid parts of the options so that old data is not kept around.
 */
let sift-options(options) {
  options.filename
  options.open
  options.open-write
  options.open-comment
  options.open-literal
  options.close
  options.close-write
  options.close-comment
  options.close-literal
  options.cache
  options.escape
  options.partial-prefix
  options.prelude
  // include an empty context to be clear that the options does not inherit anything directly.
  context: null
}

/**
 * Get the array of keys in the context that the compiler will know about.
 */
let get-helper-names(options)
  let context = if options ownskey \context
    options.context
  else
    options
  let result = [\escape, \extends, \partial, \block, ...standard-helper-names]
  if context
    for k of context
      if k not in result
        result.push k
  else
    result
  result.sort()

/**
 * Create a template given either a filepath or a chunk of egs-code.
 */
let compile-template-from-text-or-file(is-filepath as Boolean, mutable egs-code-or-filepath as String, mutable options = {context: null})
  let helper-names = get-helper-names(options)
  let compile-options = get-compile-options(options)
  make-template(
    if is-filepath
      compile-file egs-code-or-filepath, compile-options, helper-names
    else
      return-same compile egs-code-or-filepath, compile-options, helper-names
    make-helpers-factory options, #(name, current-filepath)
      find-and-compile-file.maybe-sync name, current-filepath, compile-options, helper-names
    if is-filepath
      options.cache
    else
      true)

/**
 * Create a template given the egs-code and options.
 */
let compile-template(mutable egs-code as String, mutable options = {context: null}) as Function<Promise<String>>
  compile-template-from-text-or-file false, egs-code, options

/**
 * Create a template from a given filename and options.
 */
let compile-template-from-file(filepath as String, options = {context: null}) as Function<Promise<String>, {}>
  options.filename := filepath
  compile-template-from-text-or-file true, filepath, options

/**
 * Render a chunk of egs-code given the options and optional context.
 */
let render = promise! #(egs-code as String, options = {context: null}, mutable context)* as Promise<String>
  let template = compile-template egs-code, sift-options(options)
  if not context
    if options ownskey \context
      context := options.context
    else
      context := options
  yield template.maybe-sync(context)

/**
 * Render a chunk of egs-code given the options and optional context, returning a stream.
 */
let render-stream(egs-code as String, options = {context: null}, mutable context) as SimpleEventEmitter
  let template = compile-template egs-code, sift-options(options)
  if not context
    if options ownskey \context
      context := options.context
    else
      context := options
  template.stream(context)

/**
 * Render a file given the options and the optional context.
 */
let render-file = promise! #(filepath as String, options = {context: null}, mutable context)* as Promise<String>
  options.filename := filepath
  let template = compile-template-from-file filepath, sift-options(options)
  if not context
    if options ownskey \context
      context := options.context
    else
      context := options
  yield template.maybe-sync(context)

/**
 * Render a file given the options and the optional context, returning a stream.
 */
let render-file-stream(filepath as String, options = {context: null}, mutable context) as SimpleEventEmitter
  options.filename := filepath
  let template = compile-template-from-file filepath, sift-options(options)
  if not context
    if options ownskey \context
      context := options.context
    else
      context := options
  template.stream(context)

/**
 * Handle rendering for express, which does not take a separate context and
 * expects a callback to be invoked.
 */
let express(path as String, options = {context: null}, callback as ->)!
  (from-promise! render-file(path, options))(callback)

/**
 * Traverse through a directory and find all filepaths with a particular extension.
 */
let find-all-extensioned-filepaths = promise! #(dirpath as String, ext as String)*
  let paths = yield to-promise! fs.readdir dirpath
  let result = []
  yield promisefor(3) p in paths
    let joined-path = path.join dirpath, p
    let stat = yield to-promise! fs.stat joined-path
    if stat.is-directory()
      result.push ...(yield find-all-extensioned-filepaths(joined-path, ext))
    else if stat.is-file() and path.extname(p) == ext
      result.push joined-path
  result.sort()

/**
 * Compile a folder of `.egs` files into a single `.js` file that exports
 * a single `Package` with the files referenced by the path relative to
 * `input-dirpath`.
 */
let compile-package = promise! #(input-dirpath as String, output-filepath as String, options = {})*
  let dirstat = yield to-promise! fs.stat input-dirpath
  if not dirstat.is-directory()
    throw Error "Expected '$(input-dirpath)' to be a directory."
  let input-filepaths = yield find-all-extensioned-filepaths input-dirpath, ".egs"
  let macros = yield get-prelude-macros(options.prelude)
  let ast-pipe = get-ast-pipe(get-helper-names({}))
  let {include-egs-runtime} = options
  let runtime-code = if include-egs-runtime
    yield to-promise! fs.read-file path.join(__dirname, '..', 'lib', 'runtime.js'), 'utf8'
  let full-ast-pipe(mutable root, , ast)
    let files-assigned = {}
    let is-do-wrap(node)
      node instanceof ast.Call and (node.func instanceof ast.Func or (node.func instanceof ast.Binary and node.func.op == "." and node.func.left instanceof ast.Func and node.func.right.is-const() and node.func.right.const-value() in [\call, \apply]))
    let unwrap-do-wrap(mutable node)
      while is-do-wrap(node)
        node := if node.func instanceof ast.Func
          node.func.body
        else
          node.func.left.body
      node
    let last-node(node)
      if node instanceofsome [ast.BlockStatement, ast.BlockExpression]
        node.body[* - 1]
      else
        node
    let is-returning-generator(mutable node)
      node := last-node unwrap-do-wrap node
      if node instanceof ast.Return and node.node instanceof ast.Func
        let func-return = last-node unwrap-do-wrap node.node.body
        if func-return instanceof ast.Return and func-return.node not instanceof ast.Obj
          return false
      true
    let assign-files(node)
      if node.pos.file and files-assigned not ownskey node.pos.file and is-do-wrap(node)
        files-assigned[node.pos.file] := true
        ast.Call node.pos,
          ast.Access node.pos,
            ast.Ident node.pos, \templates
            ast.Const node.pos, if is-returning-generator(node)
              \set
            else
              \set-simple
          [
            ast.Const node.pos, path.relative(input-dirpath, node.pos.file)
            node
          ]

    root := ast-pipe(root).walk assign-files
    if include-egs-runtime
      ast.Root root.pos,
        ast.Call root.pos,
          ast.Access root.pos,
            ast.Func root.pos,
              null
              [ast.Ident root.pos, \factory]
              []
              ast.IfStatement root.pos,
                ast.And root.pos,
                  ast.Binary root.pos,
                    ast.Unary root.pos,
                      \typeof
                      ast.Ident root.pos, \module
                    "!=="
                    ast.Const root.pos, \undefined
                  ast.Access root.pos,
                    ast.Ident root.pos, \module
                    ast.Const root.pos, \exports
                ast.Assign root.pos,
                  ast.Access root.pos,
                    ast.Ident root.pos, \module
                    ast.Const root.pos, \exports
                  ast.Call root.pos,
                    ast.Ident root.pos, \factory
                ast.IfStatement root.pos,
                  ast.And root.pos,
                    ast.Binary root.pos,
                      ast.Unary root.pos,
                        \typeof
                        ast.Ident root.pos, \define
                      "==="
                      ast.Const root.pos, \function
                    ast.Access root.pos,
                      ast.Ident root.pos, \define
                      ast.Const root.pos, \amd
                  ast.Call root.pos,
                    ast.Ident root.pos, \define
                    [
                      ast.Ident root.pos, \factory
                    ]
                  ast.Assign root.pos,
                    ast.Access root.pos,
                      ast.This root.pos,
                      ast.Const root.pos, options.global-export or \EGSTemplates
                    ast.Call root.pos,
                      ast.Ident root.pos, \factory
            ast.Const root.pos, \call
          [
            ast.This root.pos
            ast.Func root.pos,
              null
              []
              [\templates, \EGSRuntime]
              ast.Block root.pos, [
                ast.Assign root.pos,
                  ast.Ident root.pos, \EGSRuntime,
                  ast.Eval root.pos, """
                    (function () {
                      var exports = {};
                      var module = { exports: exports };

                      $(runtime-code.split('\n').join('\n  '))

                      return module.exports;
                    }.call(this))
                    """.split('\n').join('\n  ')
                ast.Assign root.pos,
                  ast.Ident root.pos, \templates
                  ast.Call root.pos,
                    ast.Access root.pos,
                      ast.Ident root.pos, \EGSRuntime
                      ast.Const root.pos, \Package
                    [
                      ast.Const root.pos, __VERSION__
                    ]
                root.body
                ast.Return root.pos,
                  ast.Ident root.pos, \templates
              ]
          ]
        []
        []
    else
      ast.Root root.pos,
        ast.Call root.pos,
          ast.Access root.pos,
            ast.Func root.pos,
              null
              [ast.Ident root.pos, \factory]
              []
              ast.IfStatement root.pos,
                ast.And root.pos,
                  ast.Binary root.pos,
                    ast.Unary root.pos,
                      \typeof
                      ast.Ident root.pos, \module
                    "!=="
                    ast.Const root.pos, \undefined
                  ast.Access root.pos,
                    ast.Ident root.pos, \module
                    ast.Const root.pos, \exports
                ast.Assign root.pos,
                  ast.Access root.pos,
                    ast.Ident root.pos, \module
                    ast.Const root.pos, \exports
                  ast.Call root.pos,
                    ast.Ident root.pos, \factory
                    [
                      ast.Call root.pos,
                        ast.Ident root.pos, \require
                        [ast.Const root.pos, \egs]
                    ]
                ast.IfStatement root.pos,
                  ast.And root.pos,
                    ast.Binary root.pos,
                      ast.Unary root.pos,
                        \typeof
                        ast.Ident root.pos, \define
                      "==="
                      ast.Const root.pos, \function
                    ast.Access root.pos,
                      ast.Ident root.pos, \define
                      ast.Const root.pos, \amd
                  ast.Call root.pos,
                    ast.Ident root.pos, \define
                    [
                      ast.Arr root.pos, [ast.Const root.pos, "egs-runtime"]
                      ast.Ident root.pos, \factory
                    ]
                  ast.Assign root.pos,
                    ast.Access root.pos,
                      ast.This root.pos,
                      ast.Const root.pos, options.global-export or \EGSTemplates
                    ast.Call root.pos,
                      ast.Ident root.pos, \factory
                      [
                        ast.Access root.pos,
                          ast.This root.pos,
                          ast.Const root.pos, \EGSRuntime
                      ]
            ast.Const root.pos, \call
          [
            ast.This root.pos
            ast.Func root.pos,
              null
              [
                ast.Ident root.pos, \EGSRuntime
              ]
              [\templates]
              ast.Block root.pos, [
                ast.IfStatement root.pos,
                  ast.Unary root.pos,
                    "!"
                    ast.Ident root.pos, \EGSRuntime
                  ast.Throw root.pos,
                    ast.Call root.pos,
                      ast.Ident root.pos, \Error
                      [ast.Const root.pos, "Expected EGSRuntime to be available"]
                ast.Assign root.pos,
                  ast.Ident root.pos, \templates
                  ast.Call root.pos,
                    ast.Access root.pos,
                      ast.Ident root.pos, \EGSRuntime
                      ast.Const root.pos, \Package
                    [
                      ast.Const root.pos, __VERSION__
                    ]
                root.body
                ast.Return root.pos,
                  ast.Ident root.pos, \templates
              ]
          ]
        []
        []
  yield gorillascript.compile-file {
    input: input-filepaths
    output: output-filepath
    +embedded
    +embedded-generator
    +noindent
    embedded-open: options.open
    embedded-open-write: options.open-write
    embedded-open-comment: options.open-comment
    embedded-open-literal: options.open-literal
    embedded-close: options.close
    embedded-close-write: options.close-write
    embedded-close-comment: options.close-comment
    embedded-close-literal: options.close-literal
    options.coverage
    options.source-map
    options.undefined-name
    options.uglify
    options.encoding
    options.linefeed
    macros
    ast-pipe: full-ast-pipe
  }

let wrap-Module_resolveFilename = memoize #
  let Module = require 'module'
  let old_resolveFilename = Module._resolveFilename
  Module._resolveFilename := #(request, parent)
    if request == \egs
      path.resolve(__dirname, '../index.js')
    else
      old_resolveFilename@ this, ...arguments

let package-from-directory = promise! #(input-dirpath as String, options = {})* as Promise<Package>
  let tmp-name = "egs-package-$(new Date().get-time())-$(Math.random().to-string(36).slice(2)).js"
  let tmp-path = path.join os.tmpdir(), tmp-name
  yield compile-package input-dirpath, tmp-path, options
  
  wrap-Module_resolveFilename()
  let templates = require tmp-path
  if templates not instanceof Package
    throw Error "Package did not build successfully"
  yield to-promise! fs.unlink tmp-path
  templates

module.exports := compile-template <<< {
  version: __VERSION__
  from-file: compile-template-from-file
  render
  render-file
  render-stream
  render-file-stream
  with-egs-prelude
  compile-package
  package-from-directory
  Package
  EGSError
  compile(egs-code as String = "", options = {}, helper-names = [])
    compile-code(egs-code, get-compile-options(options), helper-names)
  __express: express
  express(options = {})
    #(path as String, suboptions = {}, callback as ->)!
      express(path, {} <<< options <<< suboptions, callback)
}
