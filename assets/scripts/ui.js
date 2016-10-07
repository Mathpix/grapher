var React = require('react');
var ReactDOM = require('react-dom');
var MQ = MathQuill.getInterface(2);

var dograph = require('./mathedit.js').dograph;

Grapher.ReactComponents = {};

var EquationSidebar = React.createClass({
    render: function() {
        return (
            <div>
                <EquationOptions
                    addEquationCb={this.addEquation}
                    addVectorCb={this.addVector}
                    addPointCb={this.addPoint}
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
                <li><a href="#" onClick={this.props.addEquationCb}>Equation</a></li>
                <li><a href="#" onClick={this.props.addVectorCb}>Vector</a></li>
                <li><a href="#" onClick={this.props.addPointCb}>Point</a></li>
            </ul>
            <a className="icon-btn btn" onClick={this.props.refreshGraphCb}>
                <i className="material-icons">refresh</i>
            </a>
            <a className="icon-btn btn">
                <i className="material-icons">settings</i>
            </a>
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
    render: function() {
        return (
            <div className="eq-entry">
                <table>
                <tbody>
                    <tr>
                        <td width="15%">
                            <div className="eq-sidelabel">
                                #{this.props.eqNumber}
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
                edit: function() {}
            }
        });
        this.mathField.write(this.props.defaultEq);
        console.log(this.mathField);
    },
    getLatex: function() {
        console.log("TEXT", this.mathField.text());
        return this.mathField.latex();
    },
    onDelete: function() {
        this.props.deleteCb(this.props.myKey);
    }
});

//Grapher.ReactComponents.EquationSidebar = <EquationSidebar />;
Grapher.ReactComponents.EquationSidebar = ReactDOM.render(
    <EquationSidebar />,
    document.getElementById('eq-sidebar')
);



