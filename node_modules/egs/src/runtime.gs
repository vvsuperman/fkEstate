let helpers = do
  // everything exported here will be available by default in the context
  let helpers = {}

  class RawHTML
    def constructor(text)
      @text := text
    def to-HTML() -> @text

  /**
   * Wrap the provided text so that it will be treated as safe and non-escaped.
   */
  helpers.h := helpers.html := #(text)
    RawHTML String text

  /**
   * Wrap a string such that it could be put into a JavaScript string, e.g.
   * <script>var x = "Hello, <%=j name %>!"</script>
   */
  helpers.j := helpers.javascript := do
    let escapes = {
      "\\": "\\\\"
      "\r": "\\r"
      "\u2028": "\\u2028"
      "\u2029": "\\u2029"
      "\n": "\\n"
      "\f": "\\f"
      "'": "\\'"
      '"': '\\"'
      "\t": "\\t"
    }
    let replacer(x) -> escapes[x]
    let regex = r"""[\\\r\u2028\u2029\n\f'"\t]"""g
    #(text)
      RawHTML String(text).replace regex, replacer

  /**
   * Given the escape function and an array of [value, shouldEscape], return
   * either the value or the escaped value.
   */
  helpers.__maybe-escape := #(escape as ->, arr as [])
    if arr[1]
      escape(arr[0])
    else
      arr[0]

  helpers

const PARTIAL_PREFIX = "_"

const DEBUG = false
const DISABLE_TYPE_CHECKING = not DEBUG

/**
 * An error wrapper for specific 
 */
class EGSError extends Error
  def constructor(mutable @message as String = "")
    let err = super(message)
    if is-function! Error.capture-stack-trace
      Error.capture-stack-trace this, EGSError
    else if err haskey \stack
      @stack := err.stack
  def name = "EGSError"

/**
 * A fake implementation of path.basename so path doesn't need to be required
 * in-browser
 */
let path-basename(filepath)
  let match = r'.*?[/\\](.*)'.exec(filepath)
  if match
    match[1]
  else
    filepath

let path-dirname(filepath)
  let match = r'(.*)[/\\]'.exec(filepath)
  if match
    match[1]
  else
    '.'

let path-join(head, tail)
  if head == '.'
    tail
  else
    "$head/$tail"

/**
 * Unlike path.extname, this returns the extension from the first dot onward.
 * If the filename starts with '.', an empty string is returned.
 *
 * For example, "hello.html.egs" will return ".html.egs" rather than ".egs"
 */
let full-extname(filename)
  let match = r'^[^\.]+(\..*)$'.exec(path-basename(filename))
  if match
    match[1]
  else
    ""

/**
 * Whether the filepath has an extension or not
 */
let has-extension(filepath)
  r'.\.'.test(path-basename(filepath))

/**
 * Very simplistic version of path.resolve
 */
let path-resolve(mutable from-path, mutable to-path)
  if r'^[/\\]'.test to-path
    to-path
  else if r'^..[/\\]'.test to-path
    path-resolve path-dirname(from-path), to-path.substring(3)
  else
    path-join from-path, to-path

/**
 * Guess the filepath that is being requested relative to the file it was
 * requested from.
 */
let guess-filepath = do
  let cache = {}
  #(name, from-filepath)
    let key = "$name\0$from-filepath"
    cache[key] or=
      let mutable filename = name
      if not has-extension filename
        filename ~&= full-extname(from-filepath)
      path-resolve path-dirname(from-filepath), filename

let return-same(value) # value

let to-maybe-sync(promise-factory)
  let maybe-sync = promise-factory.maybe-sync
  for k, v of promise-factory
    maybe-sync[k] := v
  maybe-sync

let flush-stream(stream-send, write as String)
  if write and stream-send
    stream-send write
    ''
  else
    write

let simple-helpers-proto = {} <<< helpers
let helpers-proto = {} <<< helpers <<< {
  extends(name as String, locals)!
    if not @__current-filepath$
      throw EGSError "Can only use extends if the 'filename' option is specified"
    if @__in-partial$
      throw EGSError "Cannot use extends when in a partial"
    if @__extended-by$
      throw EGSError "Cannot use extends more than once"
    @__extended-by$ := @__fetch-compiled$ name
    @__extended-by-locals$ := locals
  
  partial: to-maybe-sync promise! #(mutable name as String, mutable write as String, locals = {})*
    if not @__current-filepath$
      throw EGSError "Can only use partial if the 'filename' option is specified"
    name := path-join(path-dirname(name), @__partial-prefix$ ~& path-basename(name))
    write := flush-stream @__stream-send$, write
    let {filepath, compiled: {func}} = yield @__fetch-compiled$ name
    let partial-helpers = {extends this
      __current-filepath$: filepath
      __in-partial$: true
    }
    if func.maybe-sync
      yield func.maybe-sync write, locals, partial-helpers
    else
      func write, locals, partial-helpers
  
  block: to-maybe-sync promise! #(mutable name as String, mutable write, inside as ->|null)*
    if @__in-partial$
      throw EGSError "Cannot use block when in a partial"

    write := flush-stream @__stream-send$, write
    let blocks = @__blocks$
    let root-helpers = @__helpers$
    if @__extended-by$ and not root-helpers.__in-block$
      if inside? and blocks not ownskey name
        blocks[name] := inside
      write
    else
      let block = blocks![name] or inside
      let mutable result = write
      if block
        root-helpers.__in-block$ := true
        result := yield promise!(true) block write
        root-helpers.__in-block$ := false
      result
  
  __handle-extends$: to-maybe-sync promise! #(current-write)*
    let {filepath, compiled: {func}} = yield @__extended-by$
    let new-helpers = { extends this
      __current-filepath$: filepath
      __extended-by$: null
      __extended-by-locals$: null
    }
    let locals = @__extended-by-locals$ or {}
    let text = if func.maybe-sync
      yield func.maybe-sync "", locals, new-helpers
    else
      func "", locals, new-helpers
    if new-helpers.__extended-by$
      yield new-helpers.__handle-extends$@(new-helpers, text)
    else
      text
}

/**
 * Either call a value's .toHTML() method or escape the unsafe HTML codes
 * from its String representation.
 */
let escape-HTML = do
  let full-regex = r'[&<>"]'
  let amp-regex = r'&'g
  let lt-regex = r'<'g
  let gt-regex = r'>'g
  let quot-regex = r'"'g
  let escaper(text)
    if full-regex.test text
      text
        .replace amp-regex, "&amp;"
        .replace lt-regex, "&lt;"
        .replace gt-regex, "&gt;"
        .replace quot-regex, "&quot;"
    else
      text
  #(value)
    if is-string! value
      escaper value
    else if is-number! value
      value.to-string()
    else if value and is-function! value.to-HTML
      String value.to-HTML()
    else
      throw TypeError "Expected a String, Number, or Object with a toHTML method, got $(typeof! value)"

/**
 * Make the `helpers` object to be passed into the template.
 * All global access is converted to be either `context` or `helpers` access within the template.
 */
let make-helpers-factory = do
  let make-factory(partial-prefix, current-filepath, fetch-compiled, escaper, options-context)
    let base-helpers = { extends helpers-proto }
    base-helpers <<< {
      __current-filepath$: current-filepath
      __partial-prefix$: partial-prefix
      __fetch-compiled$: fetch-compiled
      __extended-by$: null
      __extended-by-locals$: null
      __in-partial$: false
      __in-block$: false
      escape: escaper
    }
    let simple-helpers = { extends simple-helpers-proto }
    simple-helpers <<< {
      __current-filepath$: current-filepath
      escape: escaper
    }
    if options-context
      simple-helpers <<< options-context
      base-helpers <<< options-context
    #(is-simple)
      if is-simple
        simple-helpers
      else
        let helpers = { extends base-helpers }
        helpers.__helpers$ := helpers
        helpers.__blocks$ := {}
        helpers
  #(options as {}, fetch-and-compile-file)
    make-factory(
      if is-string! options.partial-prefix
        options.partial-prefix
      else
        PARTIAL_PREFIX
      options.filename
      #(name)
        fetch-and-compile-file name, @__current-filepath$
      if is-function! options.escape then options.escape else escape-HTML
      if options ownskey \context
        options.context
      else
        options)

/**
 * Make a template from the compilation that was yielded on.
 */
let make-template(get-compilation-p as ->, make-helpers as ->, cache-compilation as Boolean) as Function<Promise<String>, {}>
  let mutable compilation = void
  let template = promise! #(data)* as Promise<String>
    let mutable tmp = cache-compilation and compilation
    if not tmp
      tmp := yield get-compilation-p()
      if cache-compilation
        compilation := tmp
    let helpers = make-helpers tmp.is-simple
    let mutable result = tmp.func "", data or {}, helpers
    if result and result.then
      result := yield result
    if helpers.__extended-by$
      yield helpers.__handle-extends$.maybe-sync@(helpers, result)
    else
      result
  // this is practically the above function, only synchronous
  template.sync := #(data)
    let mutable tmp = cache-compilation and compilation
    if not tmp
      tmp := get-compilation-p().sync()
      if cache-compilation
        compilation := tmp
    let helpers = make-helpers tmp.is-simple
    let func = tmp.func
    let mutable result = (func.sync or func) "", data or {}, helpers
    if not is-string! result
      result := result.sync()
    if helpers.__extended-by$
      helpers.__handle-extends$.sync@(helpers, result)
    else
      result
  template.stream := #(data)
    let {send: stream-send, end: stream-end, throw: stream-throw, public: stream-public} = Stream()
    let promise = promise!
      let mutable tmp = cache-compilation and compilation
      if not tmp
        tmp := yield get-compilation-p()
        if cache-compilation
          compilation := tmp
      let helpers = make-helpers tmp.is-simple
      helpers.__stream-send$ := stream-send
      // definitely need at least a single-tick delay to allow for stream event registration
      yield delay! 0
      let func = tmp.func
      let mutable result = if func.stream
        func.stream stream-send, "", data or {}, helpers
      else
        func "", data or {}, helpers
      if result and result.then
        result := yield result
      if helpers.__extended-by$
        let extension = helpers.__handle-extends$
        // TODO: convert to stream
        yield extension@(helpers, result)
      else
        result
    promise
      .then(#(value)!
        if value
          stream-send value
        stream-end())
      .then null, stream-throw
    stream-public
  template.ready := promise! #!*
    if cache-compilation
      if not compilation
        compilation := yield get-compilation-p()
      let {mutable func} = compilation
      if func.sync
        func := func.sync
      // in the case where the template doesn't extend and might be called synchronously,
      // and we're caching the compilation, optimize it as much as possible.
      if compilation.is-simple
        let helpers = make-helpers(true)
        template.sync := #(data)
          let result = func "", data or {}, helpers
          if not is-string! result
            result.sync()
          else
            result
    else
      yield get-compilation-p()
  template

/**
 * A package of pre-compiled files, which can still use extends, partial, block
 * in order to make full use of the helper suite.
 *
 * This is primarily meant to be used in browsers, but could be used in
 * production-mode server apps.
 */
class Package
  def constructor(version, options)
    if version and is-object! version
      return Package@ this, null, version
    
    if version and version != __VERSION__
      throw Error "EGS Packages must be compiled with the same version as the EGS runtime: '$version' vs. '$(__VERSION__)'"
    
    @factories := {}
    @templates := {}
    @options := options ? {}
  
  let with-leading-slash(filepath as String)
    if filepath.char-code-at(0) != "/".char-code-at(0)
      "/" & filepath
    else
      filepath
  
  /**
   * Find the filepath of the requested name and return the full filepath and
   * the compiled result.
   */
  let find(factories, name as String, from-filepath as String)
    let filepath = guess-filepath name, from-filepath
    if factories not ownskey filepath
      rejected! EGSError "Cannot find '$name' from '$filepath', tried '$filepath'"
    else
      fulfilled! { filepath, compiled: { func: factories[filepath], is-simple: false } }
  
  let set(is-simple, mutable filepath as String, generator as ->, options = {})!
    filepath := with-leading-slash filepath
    let factories = @factories
    let factory = factories[filepath] := if is-simple then generator else promise! generator
    @templates[filepath] := make-template(
      return-same fulfilled! { func: factory, is-simple: false }
      make-helpers-factory(
        {__in-package$: this, filename: filepath} <<< @options <<< options
        #(name, current-filepath)
          find factories, name, current-filepath)
      true)
    
  /**
   * Set a filepath in the package to have a certain generator which will
   * become a promise, as well as any options.
   *
   * Returns `this`, for fluent APIs.
   */
  def set(mutable filepath as String, generator as ->, options = {})
    set@ this, false, filepath, generator, options
    this
  
  /**
   * Set a filepath in the package to have a certain function which should
   * return a string.
   *
   * Returns `this`, for fluent APIs.
   */
  def set-simple(mutable filepath as String, generator as ->, options = {})
    set@ this, true, filepath, generator, options
    this
  
  /**
   * Get the template for the given filepath, or throw an error if it doesn't exist.
   */
  def get(mutable filepath as String) as Function<Promise<String>, {}>
    filepath := with-leading-slash filepath
    let templates = @templates
    if templates not ownskey filepath
      throw EGSError "Unknown filepath: '$filepath'"
    else
      templates[filepath]
  
  /**
   * Render a template at the given filepath with the provided data to be used
   * as the context.
   */
  def render = promise! #(filepath as String, data = {})* as Promise<String>
    let template = @get filepath
    yield template data
  
  /**
   * Render a template at the given filepath with the provided data to be used
   * as the context, synchronously. If not possible to execute synchronously,
   * an error is thrown.
   */
  def render-sync(filepath as String, data = {}) as String
    let template = @get filepath
    template.sync data
  
  /**
   * Render a template at the given filepath with the provided data to be used
   * as the context, returning a stream.
   */
  def render-stream(filepath as String, data = {}) as SimpleEventEmitter
    let template = @get filepath
    template.stream data
  
  def express()
    #(path as String, data, callback as ->)@!
      (from-promise! @render(path, data))(callback)

/**
 * Create a stream.
 *
 * The stream has a public API, as well as three functions: `send`, `throw`,
 * and `end`.
 *
 * As soon as `throw` or `end` is called, no more events will be emitted.
 *
 * The public API consists of an Object with a single method: `on`, which is
 * expected to take a type of 'data', 'error', or 'end' and a callback for
 * when the event occurs. A single Stream should not register for the same
 * event more than once.
 */
let Stream()
  let mutable events as {}|null = {}
  let complete(type, value)!
    if events
      let event = events[type]
      // `events` might have callbacks with memory references we no longer
      // care about, so we should clear it out as it won't be used anymore.
      events := null
      if event
        set-immediate event, value
  {
    send(value as String)!
      if events
        let event = events.data
        if event
          event value
    throw(err)!
      complete \error, err
    end()!
      complete \end
    public: {
      on(type as String, callback as ->)
        if events
          events[type] := callback
        this
    }
  }

module.exports := {
  version: __VERSION__
  Package
  EGSError
  make-template
  make-helpers-factory
  guess-filepath
  helper-names: for k of helpers; k
}
