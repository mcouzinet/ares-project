enyo.kind({
	name: "Ares",
	kind: "Control",
	classes: "app onyx",
	fit: true,
	components: [
		{kind: "Panels", /*arrangerKind: "CarouselArranger",*/ classes: "enyo-fit", components: [
			{kind: "Phobos", onSaveDocument: "saveDocument", onCloseDocument: "closeDocument", onDesignDocument: "designDocument", onEditedChanged: "documentEdited"},
			{kind: "Deimos", onCloseDesigner: "closeDesigner"}
		]},
		{kind: "Slideable", style: "height: 100%; width: 100%", layoutKind: "FittableRowsLayout", classes: "onyx", axis: "v", value: 0, min: -500, max: 0, unit: "px", onAnimateFinish: "finishedSliding", components: [
			{kind: "ProjectView", fit: true, classes: "onyx", onFileDblClick: "doubleclickFile"},
			{name: "bottomBar", kind: "DocumentToolbar", 
			    onGrabberTap: "toggleFiles", 
				onSwitchFile: "switchFile", 
				onSave: "bounceSave", 
				onDesign: "bounceDesign", 
				onNewKind: "bounceNew",
				onClose: "bounceClose"
			}
		]},
		{kind: "ServiceRegistry"}
	],
	handlers: {
		onReloadServices: "handleReloadServices"
	},
	phobosViewIndex: 0,
	deimosViewIndex: 1,
	create: function() {
		this.inherited(arguments);
		this.$.panels.setIndex(this.phobosViewIndex);

		window.onbeforeunload = enyo.bind(this, "handleBeforeUnload");
		if (this.runTest) {
			// in charge of Ares Test Suite when Ares Ide launch with runTest option
			this.createComponent({kind: "ares.TestController"});
		}
		this.calcSlideableLimit();
	},
	rendered: function() {
		this.inherited(arguments);
		this.calcSlideableLimit();
	},
	openFiles: {},
	draggable: false,
	handleReloadServices: function(inSender, inEvent) {
		this.$.serviceRegistry.reloadServices();
	},
	doubleclickFile: function(inSender, inEvent) {
		var f = inEvent.file;
		var d = this.openFiles[inEvent.file.id];
		if (d) {
			this.switchToDocument(d);
		} else {
			this.$.bottomBar.createFileTab(f.name, f.id);
			this.openDocument(inSender, inEvent);
		}
	},
	openDocument: function(inSender, inEvent) {
		var f = inEvent.file;
		var service = f.service;
		var ext = f.name.split(".").pop();
		var origin = service.getConfig().origin;
		var projectUrl = origin + service.getConfig().pathname + "/file" + inEvent.projectPath;
		this.$.phobos.beginOpenDoc();
		service.getFile(f.id)
			.response(this, function(inEvent, inData) {
				if (inData.content) {
					inData=inData.content;
				} else {
					// no data? Empty file
					inData="";
				}
				if (this.openFiles[f.id]) {
					alert("Duplicate File ID in cache!");
				}
				var doc = {
					origin: origin,
					file: f,
					data: inData,
					extension: ext,
					projectUrl: projectUrl,
					edited: false
				};
				this.openFiles[f.id] = doc;
				this.switchToDocument(doc);
			})
			.error(this, function(inEvent, inData) {
				enyo.log("Open failed", inData);
				this.$.phobos.hideWaitPopup();
			});
	},
	saveDocument: function(inSender, inEvent) {
		var service = inEvent.file.service;
		service.putFile(inEvent.file.id, inEvent.content)
			.response(this, function(inEvent, inData) {
				inSender.saveComplete();
				this.$.deimos.saveComplete();
			})
			.error(this, function(inEvent, inData) {
				inSender.saveFailed(inData);
			});
	},
	closeDocument: function(inSender, inEvent) {
		var id = inSender.file.id;
		// remove file from cache
		this.openFiles[id]=undefined;
		this.$.bottomBar.removeTab(id);
		this.showFiles();
	},
	designDocument: function(inSender, inEvent) {
		this.$.deimos.load(inEvent);
		this.$.panels.setIndex(this.deimosViewIndex);
	},
	closeDesigner: function(inSender, inEvent) {
		if (inEvent.docHasChanged) {
			this.$.phobos.updateComponents(inSender, inEvent);
		}
		this.$.panels.setIndex(this.phobosViewIndex);
	},
	handleBeforeUnload: function() {
		if (window.location.search.indexOf("debug") == -1) {
			return 'You may have some unsaved data';
		}
	},
	hideFiles: function(inSender, inEvent) {
		this.$.slideable.animateToMin();
	},
	showFiles: function(inSender, inEvent) {
		this.$.slideable.animateToMax();
	},
	toggleFiles: function(inSender, inEvent) {
		if (this.$.slideable.value < 0) {
			this.showFiles();
		} else {
			this.hideFiles();
		}
	},
	resizeHandler: function(inSender, inEvent) {
		this.inherited(arguments);
		this.calcSlideableLimit();
		if (this.$.slideable.value < 0) {
			this.$.slideable.setValue(this.$.slideable.min);
		}
	},
	calcSlideableLimit: function() {
		var min = this.getBounds().height-this.$.bottomBar.getBounds().height;
		this.$.slideable.setMin(-min);
	},
	switchFile: function(inSender, inEvent) {
		var d = this.openFiles[inEvent.id];
		if (d) {
			this.switchToDocument(d);
		} else {
			alert("File ID not found in cache!");
		}
	},
	switchToDocument: function(d) {
		// save document state
		if (this.activeDocument) {
			this.activeDocument.data = this.$.phobos.getEditorContent();
		}
		if (!this.activeDocument || d !== this.activeDocument) {
			this.$.phobos.openDoc(d.origin, d.file, d.data, d.extension, d.projectUrl, d.edited);
		}
		this.$.panels.setIndex(this.phobosViewIndex);
		this.$.bottomBar.activateFileWithId(d.file.id);
		this.hideFiles();
		this.activeDocument = d;
	},
	finishedSliding: function(inSender, inEvent) {
		if (this.$.slideable.value < 0) {
			this.$.bottomBar.showControls();
		} else {
			this.$.bottomBar.hideControls();
		}
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceSave: function(inSender, inEvent) {
		this.$.phobos.saveDocAction(inSender, inEvent);
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceDesign: function(inSender, inEvent) {
		this.$.phobos.designerAction(inSender, inEvent);
	},
	// FIXME: This trampoline function probably needs some refactoring
	bounceNew: function(inSender, inEvent) {
		this.$.phobos.newKindAction(inSender, inEvent);
	},
	// FIXME: This trampoline function probably needs some refactoring
	// Close is a special case, because it can be invoked on a document other than the currently-active one
	bounceClose: function(inSender, inEvent) {
		this.switchFile(inSender, inEvent);
		enyo.asyncMethod(this.$.phobos, "closeDocAction");
	},
	documentEdited: function(inSender, inEvent) {
		var id = inEvent.id;
		if (this.openFiles[id]) {
			this.openFiles[id].edited = inEvent.edited;
		} else {
			alert("File ID not found in cache!");
		}
	}
});
