(function (window,document) {

// 文本类型
	var TEXT_ELEMENT = 'TEXT_ELEMENT'
// 创建虚拟dom
	function createElement(type, props, ...children) {
		props = Object.assign({}, props);
		props.children = [].concat(...children)
		.filter(child => child != null && child !== false)
		.map(child => child instanceof Object ? child : createTextElement(child));
		return {type, props};
	}
// 文本虚拟dom
	function createTextElement(value) {
		return createElement('TEXT_ELEMENT', {nodeValue: value});
	}

	var foo = createElement('div', {id:"foo",class:"aaa"}, 'Hello!');

	/*
	* element 虚拟dom
	* instance:{dom,element,childInstance}
	* */
	function instantiate(element) {
		const {type, props = {}} = element;

		const isDomElement = typeof type === 'string';

		// 原生dom节点
		if (isDomElement) {
			// 创建dom
			const isTextElement = type === TEXT_ELEMENT;
			const dom = isTextElement ? document.createTextNode('') : document.createElement(type);

			// 初始化dom的事件、数据属性
			updateDomProperties(dom, [], element.props);
			const children = props.children || [];
			const childInstances = children.map(instantiate);
			const childDoms = childInstances.map(childInstance => childInstance.dom);
			childDoms.forEach(childDom => dom.appendChild(childDom));
			const instance = {element, dom, childInstances};
			return instance;
			// 自定义组件
		} else {
			const instance = {};
			const publicInstance = createPublicInstance(element, instance);
			const childElement = publicInstance.render();
			const childInstance = instantiate(childElement);
			Object.assign(instance, {dom: childInstance.dom, element, childInstance, publicInstance});
			return instance;
		}
	}

	/*
	* 更新dom节点属性、事件
	* 事件也作为属性传入
	* preProps:Array<>
	* nextProps:Array<>
	* */
	function updateDomProperties(dom, prevProps, nextProps) {
		const isEvent = name => name.startsWith("on");
		const isAttribute = name => !isEvent(name) && name != "children";

		// Remove event listeners
		Object.keys(prevProps).filter(isEvent).forEach(name => {
			const eventType = name.toLowerCase().substring(2);
			dom.removeEventListener(eventType, prevProps[name]);
		});

		// Remove attributes
		Object.keys(prevProps).filter(isAttribute).forEach(name => {
			dom[name] = null;
		});

		// Set attributes
		Object.keys(nextProps).filter(isAttribute).forEach(name => {
			dom[name] = nextProps[name];
		});

		// Add event listeners
		Object.keys(nextProps).filter(isEvent).forEach(name => {
			const eventType = name.toLowerCase().substring(2);
			dom.addEventListener(eventType, nextProps[name]);
		});
	}

	/*
	* 创建组件实例
	* */
	function createPublicInstance(element, instance) {
		const {type, props} = element;
		const publicInstance = new type(props);
		publicInstance.__internalInstance = instance;
		return publicInstance;
	}

	/*
	* diff算法
	* */
	function reconcile(parentDom, instance, element) {
		/*
		* 新增节点
		* */
		if (instance === null || instance === undefined) {
			const newInstance = instantiate(element);
			// componentWillMount
			newInstance.publicInstance
			&& newInstance.publicInstance.componentWillMount
			&& newInstance.publicInstance.componentWillMount();
			// 添加子节点
			parentDom.appendChild(newInstance.dom);
			// componentDidMount
			newInstance.publicInstance
			&& newInstance.publicInstance.componentDidMount
			&& newInstance.publicInstance.componentDidMount();
			return newInstance;
			/*
			* 删除节点
			* */
		} else if (element === null) {
			// componentWillUnmount
			instance.publicInstance
			&& instance.publicInstance.componentWillUnmount
			&& instance.publicInstance.componentWillUnmount();
			// 删除子节点
			parentDom.removeChild(instance.dom);
			return null;
			/*
			* 替换节点
			* */
		} else if (instance.element.type !== element.type) {
			const newInstance = instantiate(element);

			// componentDidMount
			newInstance.publicInstance
			&& newInstance.publicInstance.componentDidMount
			&& newInstance.publicInstance.componentDidMount();
			parentDom.replaceChild(newInstance.dom, instance.dom);

			return newInstance;
			/*
			* type 为string，更新属性
			* */
		} else if (typeof element.type === 'string') {
			// 更新节点的属性
			updateDomProperties(instance.dom, instance.element.props, element.props);
			//
			instance.childInstances = reconcileChildren(instance, element);
			instance.element = element;
			return instance;
			/*
			* 递归调用
			* */
		} else {
			if (instance.publicInstance
				&& instance.publicInstance.shouldComponentUpdate) {
				if (!instance.publicInstance.shouldComponentUpdate()) {
					return;
				}
			}
			// componentWillUpdate
			instance.publicInstance
			&& instance.publicInstance.componentWillUpdate
			&& instance.publicInstance.componentWillUpdate();
			// 新element赋值给instance
			instance.publicInstance.props = element.props;

			const newChildElement = instance.publicInstance.render();
			const oldChildInstance = instance.childInstance;
			const newChildInstance = reconcile(parentDom, oldChildInstance, newChildElement);
			// componentDidUpdate
			instance.publicInstance
			&& instance.publicInstance.componentDidUpdate
			&& instance.publicInstance.componentDidUpdate();
			instance.dom = newChildInstance.dom;
			instance.childInstance = newChildInstance;
			instance.element = element;
			return instance;
		}
	}

	/*
	* 对比孩子节点
	* */
	function reconcileChildren(instance, element) {
		//
		const {dom, childInstances} = instance;
		//
		const newChildElements = element.props.children || [];

		const count = Math.max(childInstances.length, newChildElements.length);
		const newChildInstances = [];
		for (let i = 0; i < count; i++) {
			// 对 pre 虚拟dom和 next element 作对比
			newChildInstances[i] = reconcile(dom, childInstances[i], newChildElements[i]);
		}
		return newChildInstances.filter(instance => instance !== null);
	}

	let rootInstance = null;
	function render(element, parentDom) {
		const prevInstance = rootInstance;
		const nextInstance = reconcile(parentDom, prevInstance, element);
		rootInstance = nextInstance;
	}

	class Component {
		constructor(props) {
			this.props = props;
			this.state = this.state || {};
		}

		setState(partialState) {
			this.state = Object.assign({}, this.state, partialState);
			// update instance
			const parentDom = this.__internalInstance.dom.parentNode;
			const element = this.__internalInstance.element;
			reconcile(parentDom, this.__internalInstance, element);
		}
	}

	var React = {
		render,
		createElement,
		Component
	}
	window.React = React
})(window,document)
