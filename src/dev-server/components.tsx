import './components.css'

export const ComponentsPage = () => {
  return (
    <>
      <h2>Components</h2>
      <div className="component-list">

        <div className="component-item">
          <h3>Link</h3>
          <div>
            <a href="https://www.inkdrop.app/">https://www.inkdrop.app/</a>
          </div>
        </div>

        <div className="component-item">
          <h3>Button</h3>
          <div>
            <div>
              <button className="ui button">Button</button>
              <button className="ui basic button">Basic Button</button>
              <button className="ui primary button">Primary Button</button>
              <button className="ui negative button">Negative Button</button>
              <button className="ui tiny circular icon button plugin-uninstall-button "
                title="Uninstall">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"
                  name="bin-1" className="svg-icon streamline bin-1 ">
                  <defs>
                    <style>{`
                      .bin-1_svg__a {
                        fill: none;
                        stroke: currentColor;
                        stroke-linecap: round;
                        stroke-linejoin: round;
                        stroke-width: 1.5px
                      }
                      `}
                    </style>
                  </defs>
                  <path
                    d="M1.5 4.5h21M14.25 1.5h-4.5A1.5 1.5 0 0 0 8.25 3v1.5h7.5V3a1.5 1.5 0 0 0-1.5-1.5M9.75 17.25v-7.5M14.25 17.25v-7.5M18.865 21.124A1.5 1.5 0 0 1 17.37 22.5H6.631a1.5 1.5 0 0 1-1.495-1.376L3.75 4.5h16.5Z"
                    className="bin-1_svg__a"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="component-item">
          <h3 className='ui header'>Message</h3>
          <div>
            <div className="ui message">
              <div className="header">
                Changes in Service
              </div>
              <p>We just updated our privacy policy here to better service our customers. We recommend reviewing the changes.
              </p>
            </div>

            <div className="ui info message">
              <div className="header">
                Info
              </div>

              <p>Plugins add new functionality or provide new look to Inkdrop. You can activate or deactivate them at any time.
                Read&nbsp;<a href="https://docs.inkdrop.app/reference/extend-with-plugins">the manual&nbsp;<svg
                  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" name="expand-6"
                  className="svg-icon streamline expand-6 inline">
                  <defs>
                    <style>{`
                      .expand-6_svg__a {
                        fill: none;
                        stroke: currentColor;
                        stroke-linecap: round;
                        stroke-linejoin: round;
                        stroke-width: 1.5px
                      }
                    `}
                    </style>
                  </defs>
                  <path
                    d="M23.251 7.498V.748h-6.75M23.251.748l-15 15M11.251 5.248h-9a1.5 1.5 0 0 0-1.5 1.5v15a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5v-9"
                    className="expand-6_svg__a"></path>
                </svg></a> to learn more.</p>
            </div>

            <div className="ui positive message">
              <div className="header">
                You are eligible for a reward
              </div>
              <p>Go to your <b>special offers</b> page to see now.</p>
            </div>

            <div className="ui negative message">
              <div className="header">
                We're sorry we can't apply that discount
              </div>
              <p>That offer has expired
              </p>
            </div>

            <div className="ui warning message">
              <div className="header">
                Changes in Service
              </div>
              <p>We just updated our privacy policy here to better service our customers. We recommend reviewing the changes.
              </p>
            </div>

          </div>
        </div>

        <div className="component-item">
          <h3>Segment</h3>
          <div>
            <div className="plugin-list-item-view ui segments">
              <div className="ui segment ">
                <div className="header">
                  <span className="name">dev-tools</span>
                  <span className="spacer"></span>
                  <div className="additional-info">
                    <span className="version">v0.1.0</span>
                  </div>
                </div>
                <div className="description">Developer tools for Inkdrop</div>
              </div>
              <div className="ui secondary clearing segment">
                <div className="repository">
                  <a href="https://github.com/inkdropapp/inkdrop-dev-tools">
                    inkdropapp/inkdrop-dev-tools
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="component-item">
          <h3>Checkbox and Toggle</h3>
          <div>
            <div className="ui checkbox">
              <input type="checkbox" name="dev-tools" defaultChecked={true} />
              <label></label>
            </div>
            <div className="ui checkbox">
              <input type="checkbox" name="dev-tools" defaultChecked={false} />
              <label></label>
            </div>
            <div className="ui toggle checkbox">
              <input type="checkbox" name="dev-tools" defaultChecked={true} />
              <label></label>
            </div>
            <div className="ui toggle checkbox">
              <input type="checkbox" name="dev-tools" defaultChecked={false} />
              <label></label>
            </div>
          </div>
        </div>

        <div className="component-item">
          <h3>Input</h3>
          <div>
            <div className='ui form'>
              <div className='field'>
                <input type="text" placeholder="Search keybindings" defaultValue="" />
              </div>
            </div>
          </div>
        </div>

        <div className="component-item">
          <h3>Tabular Menu</h3>
          <div>
            <div className="ui tabular menu">
              <a className="item active">Popular</a>
              <a className="item ">New</a>
              <a className="item ">Themes</a>
            </div>
          </div>
        </div>

        <div className="component-item">
          <h3>Divider</h3>
          <div>
            <div className="ui divider"></div>
          </div>
        </div>

        <div className="component-item">
          <h3>Dropdown</h3>
          <div>
            <div className="ui selection dropdown active focus-outline">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1em" height="1em" name="dropdown-chevron" className="svg-icon streamline dropdown-chevron dropdown icon">
                <path fill="currentColor" d="M11.96 19.318a2.09 2.09 0 0 1-1.663-.782L.617 7.682C.031 6.9.128 5.726.911 5.14c.782-.587 1.857-.587 2.444.195l8.41 9.583c.097.098.195.098.39 0l8.41-9.583c.684-.782 1.76-.88 2.542-.195s.88 1.76.195 2.542l-.098.098-9.582 10.854c-.391.39-1.076.684-1.662.684"></path>
              </svg>
              <div className="text">
                Inbox
              </div>
              <div className="menu visible" style={{ display: 'block', overflow: 'auto', opacity: 1, height: 'auto', willChange: 'transform' }}>
                <div className="item " data-value="book:Bk5Ivk0T">
                  <span style={{ paddingLeft: 0 }}>App Development</span>
                </div>
                <div className="item " data-value="book:MiCiVxN8">
                  <span style={{ paddingLeft: 24 }}>Ideas</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </>
  );
};
