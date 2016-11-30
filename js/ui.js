var React = require('react');
var ReactDOM = require('react-dom');
var MQ = MathQuill.getInterface(2);

var Grapher = require('./3d.js');
window.Grapher = Grapher;
var dograph = require('./mathedit.js').dograph;

var ReactComponents = {};

var EquationSidebar = React.createClass({
    render: function() {
        return (
            <div>
                <EquationOptions
                    addEquationCb={this.addEquation}
                    addVectorCb={this.addVector}
                    addPointCb={this.addPoint}
                    addParametricCb={this.addParametric}
                    addVectorFieldCb={this.addVectorField} />
                <EquationList ref='eqList' />
            </div>
        );
    },
    addEquation: function() {
        this.refs.eqList.addEntry("z = ");
    },
    addVector: function() {
        this.refs.eqList.addEntry('\\begin{bmatrix} \\\\ \\\\ \\end{bmatrix}');
    },
    addPoint: function() {
        this.refs.eqList.addEntry('\\left(a, b, c\\right)');
    },
    addParametric: function() {
        var str = '\\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix} = \\begin{bmatrix} \\\\ \\\\ \\end{bmatrix}';
        this.refs.eqList.addEntry(str);
    },
    addVectorField: function() {
        var str = '\\Delta \\begin{bmatrix} x \\\\ y \\\\ z \\end{bmatrix} = \\begin{bmatrix} \\\\ \\\\ \\end{bmatrix}';
        this.refs.eqList.addEntry(str);
    },
    getEquationData: function() {
        return this.refs.eqList.getEquationData();
    }
})

var EquationOptions = React.createClass({
    render: function() {
        return (
        <div className="teal eqs-toolbar">
            <a className="dropdown-button btn" data-activates='add-dropdown'>
                <i className="material-icons left">add</i>
                Add
            </a>
             <ul id='add-dropdown' className='dropdown-content'>
                <li><a onClick={this.props.addEquationCb}>
                    Equation
                </a></li>
                <li><a onClick={this.props.addVectorCb}>
                    Vector
                </a></li>
                <li><a onClick={this.props.addPointCb}>
                    Point
                </a></li>
                <li><a onClick={this.props.addParametricCb}>
                    Parametric
                </a></li>
                <li><a onClick={this.props.addVectorFieldCb}>
                    Vector Field
                </a></li>
            </ul>
            <div className="right">
                <a href="#settings-modal" className="btn modal-trigger">
                    <i className="material-icons">settings</i>
                </a>
            </div>
            <SettingsModal/>
        </div>
        );
    },
    componentDidMount: function() {
        $('.dropdown-button').dropdown();
        $('.tooltipped').tooltip();
        $('.modal-trigger').leanModal();
    }
});

var SettingsModal = React.createClass({
    getInitialState: function() {
        return {
            backgroundColor: '#888888'
        }
    },
    render: function() {
        var settings = (
            <p>
                <input type="color" onInput={this.colorChange}
                ref="bg_color" defaultValue="#888888" id="background-picker"></input>
                <label htmlFor="thingy">Background Color</label>

                <br />

                <input type="checkbox" className="filled-in" id="grid-checkbox"
                defaultChecked="checked" onChange={this.toggleGrid} ref="gridCheckbox" />
                <label htmlFor="grid-checkbox">Show Grid</label>

                <br />

                <input type="checkbox" className="filled-in" id="box-checkbox"
                defaultChecked="checked" onChange={this.toggleBox} ref="boxCheckbox" />
                <label htmlFor="box-checkbox">Show Box</label>
            </p>
        );
        return (
            <div id="settings-modal" className="modal">
                <div className="modal-content">
                    <h4>Settings</h4>

                    {settings}
                </div>
                <div className="modal-footer">
                    <a href="#!" className="modal-action modal-close btn">
                        Close
                    </a>
                </div>
            </div>
        );
    },
    colorChange: function() {
        var bg = this.refs.bg_color.value;

        var s = this.state;
        s.backgroundColor = s;
        this.setState(s);

        Grapher._3D.Main.renderer.setClearColor(bg, 1);
    },
    toggleGrid: function(event) {
        var checked = this.refs.gridCheckbox.checked;
        Grapher._3D.Main.grid.visible = checked;
    },
    toggleBox: function(event) {
        var checked = this.refs.boxCheckbox.checked;
        Grapher._3D.Main.boxLines.visible = checked;
    }
});

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var search = location.search;
    if (search.charAt(search.length - 1) == "/") {
      search = search.substring(0, search.length - 1);
    }
    console.log(search);
    var results = regex.exec(search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

var EquationList = React.createClass({
    getInitialState: function() {
        var url = window.location.href;
        var latexListStr = getUrlParameter('latexList');
        if (latexListStr) {
          latexList = JSON.parse(latexListStr);
          var eqs = latexList.map(function(latex, idx) {
              latex = latex.replace(/\(/g, "\\left(");
              latex = latex.replace(/\)/g, "\\right)");
              return {
                  key: Math.floor(Math.random()*1000000),
                  defaultEq: latex,
                  eqNum: idx + 1
              };
          });
          return {
            eqs: eqs,
            numEqs: eqs.length
          };
        }
        return {
            eqs: [{key: 1, eqNum: 1, defaultEq: "z = "}],
            numEqs: 1
        };
    },
    componentDidMount: function() {
      window.setLatexList = this.setLatexList;
      window.getLatexList = this.getLatexList;
    },
    render: function() {
        var d = this.deleteEntry; // scope hax
        var i = 0;
        var entries = this.state.eqs.map(function(e) {
            return <EquationEntry key={e.key}
                myKey={e.key}
                eqNumber={e.eqNum} defaultEq={e.defaultEq}
                deleteCb={d}
                ref={'child_'+(i++)}/>
        });
        if (entries.length < 1) {
            entries = <div className="no-entries">No Entries</div>;
        }
        return (
            <div id="eq-list">
                {entries}
            </div>
        );
    },
    addEntry: function(text) {
        var numEqs = this.state.numEqs + 1;
        // random key
        var key = Math.floor(Math.random()*1000000);
        var eq = {key: key, defaultEq: text, eqNum: numEqs};
        this.setState({
            eqs: this.state.eqs.concat([eq]),
            numEqs: numEqs
        });
    },
    deleteEntry: function(key, equationId) {
        Grapher._3D.removeGraph(equationId);
        var numEqs = this.state.numEqs - 1;
        var eqs = [];
        var eqNum = 1;
        for (var i = 0; i < this.state.eqs.length; i++) {
            if (this.state.eqs[i].key == key)
                continue;
            var eq = this.state.eqs[i];
            eq.eqNum = eqNum;
            eqs.push(eq);
            eqNum++;
        }
        this.setState({
            eqs: eqs,
            numEqs: numEqs
        });
    },
    getEquationData: function() {
        var dataList = [];
        for (var i = 0; i < this.state.eqs.length; i++) {
            var entry = this.refs['child_'+i];
            var data = {
                latex: entry.getLatex(),
                text: entry.getText()
            }
            dataList.push(data);
        }
        return dataList;
    },
    getLatexList: function(latexList) {
      return this.getEquationData().map(
          function(elem) { return elem.latex }
      );
    },
    setLatexList: function(latexList) {
        setTimeout(function() {
          for (var i = 0; i < this.state.eqs.length; i++) {
              var entry = this.refs['child_'+i];
              Grapher._3D.removeGraph(entry.getEquationId());
          }
          var eqs = latexList.map(function(latex, idx) {
              latex = latex.replace(/\(/g, "\\left(");
              latex = latex.replace(/\)/g, "\\right)");
              return {
                  key: Math.floor(Math.random()*1000000),
                  defaultEq: latex,
                  eqNum: idx + 1
              }
          });
          this.setState({
              eqs: eqs,
              numEqs: latexList.length
          });
        }.bind(this), 0);
        return true;
    }
});

var EquationEntry = React.createClass({
    getInitialState: function() {
        return {
            error: undefined
        };
    },
    render: function() {
        var icon = undefined;
        if (this.state.error) {
            var err = this.state.error;
            var icon = (
                <i className="material-icons tooltipped"
                data-tooltip={err.msg} data-position="right"
                data-delay="50">{err.icon}</i>
            );
        } else if (this.state.success) {
            var type = this.state.success.type;
            var iconPath = "assets/images/icon_" + type + ".svg";
            var icon = <img src={iconPath} />
        }
        return (
            <div className="eq-entry">
                <table>
                <tbody>
                    <tr>
                        <td width="15%">
                            <div className="eq-sidelabel">
                                <span className="eq-sidelabel-num">{this.props.eqNumber}</span>
                                <span className="eq-sidelabel-icon">
                                    {icon}
                                </span>
                            </div>
                        </td>
                        <td width="85%">
                            <span className="eq-input-container">
                            <span className="eq-input" ref="eqInput"></span>
                            </span>
                        </td>
                    </tr>
                </tbody>
                </table>
                <div className="eq-delete-btn">
                    <a href="#" onClick={this.onDelete}>
                        <i className="material-icons">close</i>
                    </a>
                </div>
            </div>
        );
    },
    componentDidMount: function() {
        // initialize mathquill
        this.mathField = MQ.MathField(this.refs.eqInput, {
            spaceBehavesLikeTab: true,
            charsThatBreakOutOfSupSub: '+-=<>',
            autoCommands: 'pi theta sqrt',
            autoOperatorNames: 'sin cos tan csc sec cot sinh cosh tanh csch sech coth ' +
                'ln log max min sign abs exp round floor ceil mod',
            handlers: {
                edit: this.mathEdited
            }
        });
        this.mathField.write(this.props.defaultEq);
        this.mathField.focus();
        // TODO: fix initial broken rendering of default equation
        this.editConfirmed();
    },
    mathEdited: function() {
        if (this.hasEdit === undefined) {
            this.hasEdit = true;
            return;
        }

        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }

        this.currentTimeout = setTimeout(this.editConfirmed, 0.5 * 1000);
    },
    editConfirmed: function() {
        this.currentTimeout = undefined;

        var latex = this.getLatex();
        if (latex.trim() == "") {
            Grapher._3D.removeGraph(this.getEquationId());
            this.setState({
                error: undefined,
                success: undefined
            });
            return; // blanks are ok
        }

        var res = Grapher._3D.editGraph(
            this.getLatex(), this.getText(), this.getEquationId()
        );
        var error = undefined;
        var success = undefined;
        if (res['error']) {
            error = {
                msg: res['error'],
                icon: 'warning'
            };
        } else {
            success = {
                type: res['type']
            }
        }
        this.setState({
            error: error,
            success: success
        })
        $('.tooltipped').tooltip();
    },
    getLatex: function() {
        return this.mathField.latex();
    },
    getText: function() {
        return this.mathField.text();
    },
    onDelete: function() {
        this.props.deleteCb(this.props.myKey, this.getEquationId());
    },
    getEquationId: function() {
        return "eq-" + this.props.myKey;
    }
});

var Controls = React.createClass({
    getInitialState: function() {
        return {
            traceActive: false
        }
    },
    render: function() {
        var traceClass = "icon-btn btn tooltipped";
        if (this.state.traceActive) {
            traceClass += " blue";
        };
        return (<div>
            <button className="icon-btn btn" onClick={this.onShare}>
                <i className="material-icons">open_in_new</i>
            </button>
            <button className={traceClass} onClick={this.toggleTrace}
            data-tooltip="Trace Surface" data-position="right"
            data-delay="50">
                <i className="material-icons">my_location</i>
            </button>
            <button className="icon-btn btn" onClick={this.zoomIn}>
                <i className="material-icons">zoom_in</i>
            </button>
            <button className="icon-btn btn" onClick={this.zoomOut}>
                <i className="material-icons">zoom_out</i>
            </button>
        </div>);
    },
    componentDidMount: function() {
        $('.tooltipped').tooltip();
    },
    toggleTrace: function() {
        var newVal = !this.state.traceActive;
        this.setState({
            traceActive: newVal
        });
        Grapher._3D.Main.traceActive = newVal;

        var ele = document.getElementById("trace-info-container");
        if (newVal) {
            ele.setAttribute('style', 'display: block');
        } else {
            ele.setAttribute('style', 'display: none');
        }
    },
    onShare: function() {
        var latexList = getLatexList();
        var queryStr = encodeURI(JSON.stringify(latexList));
        var url = "http://grapher.mathpix.com/" + "?latexList=" + queryStr;
        window.open(url);
    },
    zoomIn: function() {
        Grapher.Options.zoomCoeff /= 2;
        Grapher._3D.refreshAll();
    },
    zoomOut: function() {
        Grapher.Options.zoomCoeff *= 2;
        Grapher._3D.refreshAll();
    }
});

//Grapher.ReactComponents.EquationSidebar = <EquationSidebar />;
ReactComponents.EquationSidebar = ReactDOM.render(
    <EquationSidebar />,
    document.getElementById('eq-sidebar')
);

ReactDOM.render(
    <Controls />,
    document.getElementById('controls-container')
);

