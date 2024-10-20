import { getCSSVariables } from "./get-css-variables";

export const ComponentsPage = () => {
  return (
    <>
      <h2>Components</h2>
      <div className="component-list">
        <div className="component-item">
          <h3>Button</h3>
          <div>
            <button className="ui button">Button</button>
            <button className="ui basic button">Basic Button</button>
            <button className="ui primary button">Primary Button</button>
            <button className="ui negative button">Negative Button</button>
          </div>
        </div>
        <div className="component-item">
          <h3>Button</h3>
          <div>
            <button className="ui button">Button</button>
            <button className="ui basic button">Basic Button</button>
            <button className="ui primary button">Primary Button</button>
            <button className="ui negative button">Negative Button</button>
          </div>
        </div>
      </div>
    </>
  );
};
