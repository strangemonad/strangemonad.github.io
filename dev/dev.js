var SMDev = (function(self, $) {
  
  /**
    * A modular iPad grid system.
    * 64 x 64 chunked subgrid (16 x 12) with major groupings on 256
    * This makes quick work of iPad's 1024 x 768 in both landscape
    * and portrait (4 cols, 3 rows | 3 cols x 4 rows | just cols or just rows).
    *
    * e.g.:
    * toggleGrid(); // subgrid only (64 x 64)
    * toggleGrid("c"); // group columns 
    * toggleGrid("r"); // group rows
    * toggleGrid("cr"); // group both columns and rows
    */
  self.toggleGrid = function() {
    $("body")
      .removeClass("c")
      .removeClass("r")
      .removeClass("cr")
      .toggleClass("smd-grid");
    if (arguments[0] != null) $("body").addClass(arguments[0]);
  }

  return self;
})(SMDev || {}, jQuery);