transporter.module.create('projects/projects', function(requires) {}, function(thisModule) {
  

thisModule.addSlots(avocado, function(add) {
  
  add.creator('project', {}, {category: ['projects']});
  
});
  

thisModule.addSlots(avocado.project, function(add) {
  
  add.method('current', function () {
    return this._current || (this._current = this.create("This project"));
  }, {category: ['current one']});
  
  add.method('create', function (name) {
    return Object.newChildOf(this, name);
  }, {category: ['creating']});
  
  add.method('initialize', function (name) {
    this.setName(name);
    transporter.idTracker.createTemporaryIDFor(this);
  }, {category: ['creating']});
  
  add.method('name', function () { return this._name; }, {category: ['accessing']});
  
  add.method('setName', function (n) { this._name = n; }, {category: ['accessing']});
  
  add.method('id', function () { return this._projectID; }, {category: ['accessing']});
  
  add.method('setID', function (id) { this._projectID = id; }, {category: ['accessing']});
  
  add.method('module', function () { return modules.thisProject; }, {category: ['accessing']});
  
  add.method('inspect', function () { return this.name(); }, {category: ['printing']});
  
  add.method('save', function (evt) {
    var versionsToSave = {};
    var modulesNotToSave = {};
    var modulesLeftToLookAt = [this.module()];
    while (modulesLeftToLookAt.length > 0) {
      var m = modulesLeftToLookAt.pop();
      if (!modulesNotToSave[m.name()] && !versionsToSave[m.name()]) {
        // aaa - Could make this algorithm faster if each module knew who required him - just check
        // if m itself has changed, and if so then walk up the requirements chain making sure that
        // they're included.
        if (m.haveIOrAnyOfMyRequirementsChangedSinceLastFileOut()) {
          versionsToSave[m.name()] = m.createNewVersion();
          m.requirements().each(function(requiredModuleName) { modulesLeftToLookAt.push(modules[requiredModuleName])});
        } else {
          modulesNotToSave[m.name()] = m;
        }
      }
    }
    
    var moduleGraph = avocado.graphs.directed.create([this.module()], function(m) { return m.requiredModules(); });
    var sortedModules = moduleGraph.topologicalSort();
    var sortedVersionsToSave = [];
    sortedModules.each(function(m) {
      var v = versionsToSave[m.name()];
      if (v) { sortedVersionsToSave.push(v); }
    });
    
    var mockRepo = avocado.project.repository.create(this);
    mockRepo.setRoot(versionsToSave[this.module().name()]);
    var errors = transporter.fileOutPlural(sortedVersionsToSave.map(function(v) { return { moduleVersion: v }; }), evt, mockRepo, transporter.module.justBodyFilerOuter);
    if (errors.length === 0) {
      mockRepo.save(function() { console.log("Triumph!"); }, function(failureReason) { console.log("Aww, man: " + failureReason); });
    } else {
      console.log("Not saving because there were transporter errors.");
    }
  }, {category: ['saving']});

  add.creator('repository', {}, {category: ['saving']});
  
  add.method('buttonCommands', function () {
    return avocado.command.list.create(this, [
      avocado.command.create('Save', this.save)
    ]);
  }, {category: ['user interface', 'commands']});
  
});


thisModule.addSlots(avocado.project.repository, function(add) {
  
  add.method('create', function (project) {
    return Object.newChildOf(this, project);
  }, {category: ['creating']});
  
  add.method('initialize', function (project) {
    this._project = project;
    this._projectData = { _id: project.id(), name: project.name(), modules: [] };
  }, {category: ['creating']});

  add.method('setRoot', function (rootModuleVersion) {
    this._projectData.root = rootModuleVersion.versionID();
  }, {category: ['saving']});
  
  add.method('fileOutModuleVersion', function (moduleVersion, codeToFileOut, successBlock, failBlock) {
    this._projectData.modules.push({
      module: moduleVersion.module().name(),
      version: moduleVersion.versionID(),
      parents: moduleVersion.parentVersions().map(function(pv) { return pv.versionID(); }),
      reqs: moduleVersion.requiredModuleVersions().map(function(v) { return v.versionID(); }),
      code: codeToFileOut
    });
  }, {category: ['saving']});
  
  add.method('save', function (successBlock, failBlock) {
    var json = Object.toJSON(this._projectData);
    // aaa - I imagine it's possible to send the JSON without encoding it as a POST parameter, but let's not worry about it yet.
    var postBody = "projectDataJSON=" + encodeURIComponent(json);
    var url = "http://localhost:3000/project/save"; // aaa don't hard-code this
    console.log("About to save the project to URL " + url + ", sending JSON:\n" + json);
    var req = new Ajax.Request(url, {
      method: 'post',
      //postBody: postBody,
      //contentType: 'application/x-www-form-urlencoded',
      postBody: json,
      contentType: 'application/json',

      asynchronous: true,
      onSuccess:   function(transport) { this.onSuccessfulSave(transport.responseText, successBlock, failBlock); }.bind(this),
      onFailure:   function(t        ) { failBlock("Failed to file out project " + this._project + " to repository " + this + "; HTTP status code was " + req.getStatus()); }.bind(this),
      onException: function(r,      e) { failBlock("Failed to file out project " + this._project + " to repository " + this + "; exception was " + e); }.bind(this)
    });
  }, {category: ['saving']});
  
  add.method('onSuccessfulSave', function (responseText, successBlock, failBlock) {
    var realIDsByTempID = JSON.parse(responseText);
    for (var tempID in realIDsByTempID) {
      transporter.idTracker.recordRealID(tempID, realIDsByTempID[tempID]);
    }
    successBlock();
  }, {category: ['saving']});
  
});


});
