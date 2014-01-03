// Assumes jQuery as $ for now

if (!Widgets) {
  var Widgets = {}
}

Widgets.Data = (function() {
  var that = {};

  // VISUAL UI
  // jQuery wrapper of the container element
  var content = null;
  var maxBits = 32;
  var representation = Math.pow(2, maxBits);

  // Logical UI
  // selection is inherent in the focused element i.e. key events will originate from it

  // MODEL

  // Value in decimal
  var value = Number(0);

  function onBit(character, base) {
    var increment = parseInt(character, base);
    if (isNaN(increment)) {
      // blah jiggle it.
      return;
    }

    value *= base;
    value += increment;

    // Simple wrapping overflow for now.
    var maybeOver = value - representation;
    if (maybeOver > 0) value = maybeOver;
  }

  function onKeyUp(e) {
    e.preventDefault();

    var source = $(e.target);
    var character = String.fromCharCode(e.keyCode);

    if (e.keyCode == 27) value = 0; //esc
    else if (source.hasClass("widget-decimal")) onBit(character, 10);
    else if (source.hasClass("widget-hex")) onBit(character, 16);
    else if (source.hasClass("widget-binary")) onBit(character, 2);

    render();
  }

  function getBitClicked(binDigitSpan) {
    return (maxBits - 1) - $(binDigitSpan).index();
  }


  // Bit ops:
  // Prevent signed 2's complement that would result when the high-bit is set
  // normally would just do 'value ^= 1 << clickedBit';

  function toggleBit(bit) {
    var positionValue = Math.pow(2, bit);
    if (value & positionValue) {
      value -= positionValue;
    } else {
      value += positionValue;
    }
  }

  function setBit(bit) {
    var positionValue = Math.pow(2, bit);
    if (!(value & positionValue)) {
      value += positionValue;
    }
  }

  function unsetBit(bit) {
    var positionValue = Math.pow(2, bit);
    if (value & positionValue) {
      value -= positionValue;
    }
  }

  // Byte ops - 4-bit byte alignment
  // e.g. bit 0-3 affect byte 0

  function setByte(bit) {
    // set all bits in this byte - bit should be byte[0] byte-aligned
    if (bit > (maxBits - 4)) {
      return;
    }

    setBit(bit);
    setBit(bit + 1);
    setBit(bit + 2);
    setBit(bit + 3);
  }

  function unsetByte(bit) {
    // unset all bits in this byte. see setByte
    if (bit > (maxBits - 4)) {
      return;
    }

    unsetBit(bit);
    unsetBit(bit + 1);
    unsetBit(bit + 2);
    unsetBit(bit + 3);
  }

  function toggleByte(bit) {
    // from [bit, bit+3] all 1s -> 0s and 0s to 1s
    if (bit > (maxBits - 4)) {
      return;
    }

    toggleBit(bit);
    toggleBit(bit + 1);
    toggleBit(bit + 2);
    toggleBit(bit + 3);
  }

  function onBinMouseDown(e) {
    var lastX = e.offsetX;
    content.mousemove(function(e) {
      e.preventDefault();

      if (!$(e.target).parent().hasClass("widget-binary")) {
        // Not dragging over a bit span.
        return;
      }

      var x = e.offsetX;
      var direction = x - lastX;
      lastX = x;
      var currentBit = getBitClicked(e.target);

      // XXX this is racy since we're modifying the model.
      if (direction < 0) setBit(currentBit); // Dragging right-left - Make all 1s
      else unsetBit(currentBit); // Dragging left-right - Make all 0s

      render();
    });
  }

  function onBinMouseUp(e) {
    content.unbind("mousemove");
  }

  function onClick(e) {
    e.preventDefault();

    // Click on a bit - flip that bit.
    if ($(e.target).parent().hasClass("widget-binary")) {
      // MSB first using the index of the clicked span within its parent.
      var clickedBit = getBitClicked(e.target);
      if (e.shiftKey) {
        var indicatorBit = Math.floor(clickedBit / 4) * 4;
        if (e.altKey) {
          toggleByte(indicatorBit);
        } else {
          // TODO indicate visually
          var positionValue = Math.pow(2, indicatorBit);
          if (value & positionValue) {
            unsetByte(indicatorBit);
          } else {
            setByte(indicatorBit);
          }
        }
      } else {
        toggleBit(clickedBit);
      }

      render();
    }
  }

  function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function generate() {
    // MODEL
    value = 0;

    // Logical
    selection = 'dec';

    // VISUAL
    content
        .empty()
        .append("<div tabindex='2' class='widget-binary widget-field'></div>")
        .append(
            "<div class='widget-bin-markers'>"
            + "<span>31</span>"
            + "<span class='sixteen'>15</span>"
            + "<span class='zero'>0</span>"
            + "</div>")
        .append("<span style='font-size: .9rem;'>0x</span> <span tabindex='1' class='widget-hex widget-field'></span>")
        .append("<span tabindex='0' autofocus='autofocus' class='widget-decimal widget-field'></span>")
        .keyup(onKeyUp)
        .click(onClick);

    content.children(".widget-binary")
        .mousedown(onBinMouseDown)
        .mouseup(onBinMouseUp)
  }

  function render() {
    // All about visual given the model + logical states
    content.children(".widget-hex").text(value.toString(16));
    content.children(".widget-decimal").text(value.toString(10));

    var binValue = value.toString(2);
    var binPadding = binValue.length < maxBits ? new Array(maxBits - binValue.length + 1).join("0") : "";
    var bin = content.children(".widget-binary").empty();

    binPadding.split("").forEach(function(e) {
      bin.append("<span class='widget-bin-padding'>" + e + "</span>")
    });
    binValue.split("").forEach(function(e) {
      bin.append("<span>" + e + "</span>")
    });
  }

  that.init = function(containerId) {
    var container = $("#" + containerId);
    if (!container) {
      console.log("invalid container: " + containerId);
      return;
    }

    content = $("<div class='widget-content' style='width: 320px; margin-left: auto; margin-right: auto;'></div>");
    container.empty().append(content);

    generate();
    render();
  }

  return that;
}());
