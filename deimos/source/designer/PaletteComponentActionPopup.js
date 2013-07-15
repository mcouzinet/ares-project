enyo.kind({
	name: "PaletteComponentActionPopup",
	kind: "onyx.Popup",
	published:{
		configComponent:"",
		targetComponent:""
	},
	components:[
		{name:"title", content: "Select View Template Actions"},
		{name:"body", kind: "FittableRows", noStretch:true, components: [
			{name: "vtAction", kind: "ViewTemplateAction", showing:false },
			{name: "close", kind: "onyx.Button", content: "Cancel", centered: true, style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"}	
		]}
	],
	events: {
		onPaletteComponentAction : ""
	},

	setActionShowing: function(actionName){
		for(var n in this.$){
			this.$[n].setShowing(false);
		}
		this.$.title.setShowing(true);
		this.$.body.setShowing(true);
		this.$[actionName].setShowing(true);
		this.$.close.setShowing(true);
	}
});

enyo.kind({
	name: "ViewTemplateAction",
	kind: "FittableRows",
	noStretch:true,
	components: [
		{name: "addPanel", kind: "onyx.Button",  content: "Add new Panel", style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"},
		{name: "replaceKind", kind: "onyx.Button", content: "Replace this Kind", centered: true, style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"},
		{name: "addkind", kind: "onyx.Button", content: "Add new Kind", centered: true, style:"width:200px;height:30px;", ontap: "doPaletteComponentAction"}
	],
	events: {
		onPaletteComponentAction : ""
	}
})