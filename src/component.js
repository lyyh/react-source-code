/**
 * Created by anserliu on 2018/12/17.
 */
class TodoList extends React.Component{
	constructor (props){
		super(props)
		this.state = {
			a:1
		}
	}
	componentDidMount(){
		console.log('did mount')

	}
	componentWillMount(){
		console.log('will mount')
	}
	onClick(){
		this.setState({
			a:++this.state.a
		})
	}
	render(){
		const {a} = this.state
		const inputChild = React.createElement('input', {value:this.state.a})
		const buttonChild = React.createElement('button',{onClick:this.onClick.bind(this)},'点我')
		var ulChild = React.createElement('ul',{},[])
		for(var i =0;i<a;i++){
			var childLi = React.createElement('li',{},`${a}`)
			var newChild = ulChild.props.children.concat([childLi])
			ulChild = React.createElement('ul',{},newChild)

		}
		return React.createElement('div', {id:"foo",class:"aaa"}, [inputChild,buttonChild,ulChild]);
	}
}

var Comp = React.createElement(TodoList,{})

React.render(
	Comp,
	document.getElementById('root')
)

console.log(Comp)