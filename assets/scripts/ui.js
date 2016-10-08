Grapher.ReactComponents = {};

var EquationSidebar = React.createClass({
    render: function() {
        return (
            <div>
                <EquationOptions
                    addEquationCb={this.addEquation}
                    addVectorCb={this.addVector}
                    addPointCb={this.addPoint}
                    addParametricCb={this.addParametric}
                    refreshGraphCb={this.refreshGraph}/>
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
    refreshGraph: function() {
        var latexArr = this.getLatexEquations();
        dograph(latexArr);
    },
    getLatexEquations: function() {
        return this.refs.eqList.getLatexEquations();
    }
})

var EquationOptions = React.createClass({
    getInitialState: function() {
        return {
            traceActive: false
        };
    },
    render: function() {
        var traceClass = "icon-btn btn tooltipped";
        if (this.state.traceActive) {
            traceClass += " blue";
        }

        return (
        <div className="teal eqs-toolbar">
            <a className="dropdown-button btn" data-activates='add-dropdown'>
                <i className="material-icons left">add</i>
                Add
            </a>
             <ul id='add-dropdown' className='dropdown-content'>
                <li><a href="#" onClick={this.props.addEquationCb}>
                    Equation
                </a></li>
                <li><a href="#" onClick={this.props.addVectorCb}>
                    Vector
                </a></li>
                <li><a href="#" onClick={this.props.addPointCb}>
                    Point
                </a></li>
            </ul>
            <a className={traceClass}
                data-position="bottom" data-delay="50" data-tooltip="trace surface"
                onClick={this.toggleTrace}>
                <i className="material-icons">my_location</i>
            </a>

        </div>
        );
    },
    componentDidMount: function() {
        $('.dropdown-button').dropdown();
        $('.tooltipped').tooltip();
    },
    toggleTrace: function() {
        var newState = !this.state.traceActive
        this.setState({
            traceActive: newState
        });
        Grapher._3D.Main.traceActive = newState;

        var ele = document.getElementById("trace-info-container");
        if (newState) {
            ele.setAttribute('style', 'display: block');
        } else {
            ele.setAttribute('style', 'display: none');
        }
    }
});

var EquationList = React.createClass({
    getInitialState: function() {
        return {
            eqs: [{key: 1, eqNum: 1, defaultEq: "z = "}],
            numEqs: 1
        };
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
    deleteEntry: function(key) {
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
    getLatexEquations: function() {
        var arr = [];
        for (var i = 0; i < this.state.eqs.length; i++) {
            var entry = this.refs['child_'+i];
            arr.push(entry.getLatex());
        }
        return arr;
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
            handlers: {
                edit: this.mathEdited
            }
        });
        this.mathField.write(this.props.defaultEq);
        this.mathField.focus();
    },
    mathEdited: function() {
        if (this.hasEdit === undefined) {
            this.hasEdit = true;
            return;
        }

        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }

        this.currentTimeout = setTimeout(this.editConfirmed, 0.8 * 1000);
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
            this.getLatex(), this.getEquationId()
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
    onDelete: function() {
        Grapher._3D.removeGraph(this.getEquationId());

        this.props.deleteCb(this.props.myKey);
    },
    getEquationId: function() {
        return "eq-" + this.props.myKey;
    }
});

//Grapher.ReactComponents.EquationSidebar = <EquationSidebar />;
Grapher.ReactComponents.EquationSidebar = ReactDOM.render(
    <EquationSidebar />,
    document.getElementById('eq-sidebar')
);



