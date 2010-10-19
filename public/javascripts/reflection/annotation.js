transporter.module.create('reflection/annotation', function(requires) {}, function(thisModule) {


thisModule.addSlots(annotator, function(add) {

  add.method('creatorChainLength', function (o) {
    var len = 0;
    while (o !== window) {
      var anno = this.existingAnnotationOf(o);
      if (!anno) { return null; }
      var cs = anno.theCreatorSlot(); // aaa wrong - should be probableCreatorSlot, I think, but gotta avoid infinite loop
      if (!cs) { return null; }
      len += 1;
      o = cs.holder;
    }
    return len;
  }, {category: ['creator slots']});

});


thisModule.addSlots(annotator.objectAnnotationPrototype, function(add) {

  add.method('categorize', function (catParts, slotNames) {
    // Just a shortcut to let us categorize a bunch of slots at a time.
    for (var i = 0, n = slotNames.length; i < n; ++i) {
      var slotName = slotNames[i];
	    this.slotAnnotation(slotName).category = catParts;
    }
  }, {category: ['categories']});

  add.method('theCreatorSlot', function () {
    var cs = this.explicitlySpecifiedCreatorSlot();
    if (cs) { return cs; }
    var slots = this.possibleCreatorSlots;
    return slots && slots.length === 1 ? slots[0] : null;
  }, {category: ['creator slots']});

  add.method('probableCreatorSlot', function () {
    var cs = this.explicitlySpecifiedCreatorSlot();
    if (cs) { return cs; }
    var slots = this.possibleCreatorSlots;
    if (! slots)            { return null;     }
    if (slots.length === 0) { return null;     }
    if (slots.length === 1) { return slots[0]; }
    var shortest = null;
    var shortestLength;
    for (var i = 0, n = slots.length; i < n; ++i) {
      var s = slots[i];
      var sLength = annotator.creatorChainLength(s.holder);
      if (typeof(sLength) === 'number') {
        if (!shortest || sLength < shortestLength) {
          // This one's shorter, so probably better; use it instead.
          shortest = s;
          shortestLength = sLength;
        }
      }
    }
    return shortest;
  }, {category: ['creator slots']});

});


});
