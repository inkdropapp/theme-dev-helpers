import themeVariableManifest from '@inkdropapp/css/variables.json'
import { getCSSVariables } from './get-css-variables'

const themeVariableNames = Object.values(themeVariableManifest).flat()

export const VariablesPage = () => {
  const cssVariables = getCSSVariables()
  return (
    <>
      <h2>Variables</h2>
      <div className="variable-list">
        {themeVariableNames.map((variableName) => {
          return (
            <div key={variableName} className="variable-item">
              <div
                className="color-box"
                style={{
                  background: `var(${variableName})`
                }}
              ></div>
              <div className="data">
                <div className="variable-name">{variableName}</div>
                <div className="variable-value">{cssVariables[variableName]}</div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
