export function getCSSVariables() {
  const computedStyles = document.body.computedStyleMap();
  const variables: Record<string, string> = {};
  for (const [prop, val] of computedStyles) {
    if (prop.startsWith('--')) {
      variables[prop] = val.toString();
    }
  }


  return variables
}
