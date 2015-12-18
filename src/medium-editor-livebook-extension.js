const PLACEHOLDER_ID_BASE = "placeholder";

function createLivebookExtension(options) {
    let {onChange, getCurrentCode, getCurrentCodeList} = options;

    let codeindex;

    let result = { init, checkState, forceUpdate: (ids) => setCodeBlockPositions(ids) };
    let editor = null;

    return result;

    function init() {
        // Called by MediumEditor during initialization. 
        // The .base property will already have been set to current instance of MediumEditor when this is called.
        // All helper methods will exist as well.
        editor = this.base;

        editor.subscribe("editableKeydown", (event) => { if (isCommandJ(event)) addCodeCell(); });
        editor.subscribe("editableKeydown", (_) => { highlightSelectedCodeCell(editor); }); // TODO - scope to certain keys
        editor.subscribe("editableInput", (_) => { validateContents(editor); });

        validateContents(editor);
        window.onresize = function() {
          validateContents(editor);
        }
    }

    function checkState(node) {

        // If implemented, this method will be called one or more times after the state of the editor & toolbar are updated. When the state is updated, the editor does the following:

        // 1. Find the parent node containing the current selection
        // 2. Call checkState(node) on each extension, passing the node as an argument
        // 3. Get the parent node of the previous node
        // 4. Repeat steps #2 and #3 until we move outside the parent contenteditable
    }

    function setCodeBlockPositions(ids) {
      console.log("SET CODE BLOCK", ids);
      ids.forEach((index) => {
        let overlay = document.getElementById("overlay" + index)
  
        if (!overlay) {
          console.log("No overlays found - returning early. (livebookExtension)");
          return;
        }

        let placeholder = document.getElementById(PLACEHOLDER_ID_BASE + index)
        let placeholder_rect = placeholder.getBoundingClientRect();
        let overlay_rect = overlay.getBoundingClientRect();
        let height = overlay_rect.height;

        // console.log("placeholder_rect",placeholder_rect)
        // console.log("overlayrect",overlay_rect)

        placeholder.style.height = height + "px"

        overlay.style.position = "absolute";
        overlay.style.top = (placeholder_rect.top + window.scrollY) + "px";
        // overlay.style.left = placeholder_rect.left + "px";
        overlay.style.marginTop = "0"; // overrides some default stylings

        // overlay.style.width = placeholder_rect.width + "px";

        // let overlay_rect2 = overlay.getBoundingClientRect();
        // let placeholder_rect2 = placeholder.getBoundingClientRect();
      })
    }

    function addCodeCell() {
      let index = makeNewCodeBlock()
      editor.pasteHTML(`<p><img data-class="placeholder" id="${PLACEHOLDER_ID_BASE}${index}" width="100%" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNgYPhfDwACggF/yWU3jgAAAABJRU5ErkJggg=="></p>`,{ cleanAttrs: ["style","dir"], })
    }

    function validateContents(editor) {
      let codeDelta = {};
      let prevCodeList = getCurrentCodeList();

      let seen = reducePlaceholders((seen, placeholder) => {
        let id = getPlaceholderId(placeholder);
        let isDuplicate = seen.includes(id);
        let currentCode = getCurrentCode(id);
        let isDeadCode = (currentCode !== undefined) && !prevCodeList.includes(id);

        if (isDuplicate || isDeadCode) {
          let index = codeindex++;

          codeDelta[index] = currentCode;

          placeholder.id = PLACEHOLDER_ID_BASE + index;

          seen.push(index);
        }
        else {
          seen.push(id);
        }

        return seen;
      });

      // BAD INPUT COULD FUX WITH THIS PLACEMENT
      codeindex = codeindex || (seen.slice().sort((a, b) => { +a >= +b })[0] || 0) + 1;

      onChange({
        codeList: seen,
        codeDelta,
      });

      console.log("seen", seen);
      console.log("prevCodeList", prevCodeList)

      setCodeBlockPositions(seen);
    }

    function reducePlaceholders(f) {
      return getAllPlaceholders().reduce(f, []);
    }

    function getAllPlaceholders() {
      return [].slice.call(document.querySelectorAll("img[data-livebook-placeholder-cell]"));
    }

    function getPlaceholderId(placeholderElt) {
      // debugger;
      return placeholderElt.id.replace("placeholder", "");
    }
}

module.exports = createLivebookExtension;

function highlightSelectedCodeCell(editor) {
  let selectedParent = editor.getSelectedParentElement();
  let placeholder = selectedParent.querySelector("img[data-livebook-placeholder-cell]");

  removeOldHighlights();

  if (placeholder) {
    addHighlight(placeholderToCodeCell(placeholder));
  }
}

function removeOldHighlights() {
  [].forEach.call(document.querySelectorAll(".active-code-cell"), removeHighlight)
}

function addHighlight(elt) {
  elt.classList.add("active-code-cell");
}

function removeHighlight(elt) {
  elt.classList.remove("active-code-cell");
}

function placeholderToCodeCell(placeholder) {
  let id = placeholder.id.replace("placeholder", "");
  let codeCell = document.getElementById("overlay" + id);
  return codeCell;
}

function isCommandJ(event) {
    let J = 74;
    return event.metaKey && event.which === J;
}