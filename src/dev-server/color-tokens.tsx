import { getCSSVariables } from './get-css-variables'

export const ColorTokensPage = () => {
  const cssVariables = getCSSVariables()

  return (
    <>
      <h2>Color Tokens</h2>
      <div className='variable-list'>
        {Object.keys(cssVariables)
          .filter(name => name.startsWith('--color') || name.startsWith('--hsl'))
          .map(variableName => {
            return (
              <div key={variableName} className='variable-item'>
                <div className='color-box' style={{
                  background: variableName.startsWith('--hsl') ? `hsl(var(${variableName}))` : `var(${variableName})`
                }}></div>
                <div className='data'>
                  <div className='variable-name'>{variableName}</div>
                  <div className='variable-value'>
                    {cssVariables[variableName]}
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </>
  )
}

