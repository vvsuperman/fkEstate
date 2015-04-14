macro extends(name, locals)
  let new-context = if locals and not locals.is-const()
    ASTE {} <<< context <<< $locals
  else
    ASTE context
  ASTE context.extends $name, $new-context

macro block
  syntax ident as Identifier, body as GeneratorBody?
    let name = @const ident.name
    if body?
      ASTE! write := yield context.block $name, first!(write, (write := '')), #(write)*
        $body
        write
    else
      ASTE! write := yield context.block $name, first!(write, (write := ''))

macro partial(name, locals)
  let new-context = if locals and not locals.is-const()
    ASTE {} <<< context <<< $locals
  else
    ASTE context
  
  ASTE! write := yield context.partial $name, first!(write, (write := '')), $new-context
