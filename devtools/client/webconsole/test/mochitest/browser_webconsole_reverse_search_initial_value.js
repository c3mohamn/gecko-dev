/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Tests reverse search features.

"use strict";

const TEST_URI = `data:text/html,<meta charset=utf8>Test reverse search initial value`;

add_task(async function() {
  // Run test with legacy JsTerm
  await pushPref("devtools.webconsole.jsterm.codeMirror", false);
  await performTests();
  // And then run it with the CodeMirror-powered one.
  await pushPref("devtools.webconsole.jsterm.codeMirror", true);
  await performTests();
});

async function performTests() {
  const hud = await openNewTabAndConsole(TEST_URI);
  const { jsterm } = hud;

  const jstermHistory = [
    `Dog = "Snoopy"`,
    `document
       .querySelectorAll("*")
       .forEach(console.log)`,
    `document`,
    `"😎"`,
  ];

  const onLastMessage = waitForMessage(hud, `"😎"`);
  for (const input of jstermHistory) {
    await jsterm.execute(input);
  }
  await onLastMessage;

  const jstermInitialValue = "ado";
  jsterm.setInputValue(jstermInitialValue);

  info(`Select 2 chars ("do") from the input`);
  if (jsterm.inputNode) {
    jsterm.inputNode.selectionStart = 1;
    jsterm.inputNode.selectionEnd = 3;
  } else {
    jsterm.editor.setSelection({line: 0, ch: 1}, {line: 0, ch: 3});
  }

  info("Check that the reverse search toolbar as the expected initial state");
  let reverseSearchElement = await openReverseSearch(hud);
  is(reverseSearchElement.querySelector("input").value, "do",
    `Reverse search input has expected "do" value`);
  is(isReverseSearchInputFocused(hud), true, "reverse search input is focused");
  ok(reverseSearchElement, "Reverse search is displayed with a keyboard shortcut");
  const infoElement = getReverseSearchInfoElement(hud);
  is(infoElement.textContent, "3 of 3 results", "The reverse info has the expected text");

  const previousButton = reverseSearchElement.querySelector(".search-result-button-prev");
  const nextButton = reverseSearchElement.querySelector(".search-result-button-next");
  ok(previousButton, "Previous navigation button is displayed");
  ok(nextButton, "Next navigation button is displayed");

  is(jsterm.getInputValue(), "document", "JsTerm has the expected input");
  is(jsterm.autocompletePopup.isOpen, false,
    "Setting the input value did not trigger the autocompletion");

  const onJsTermValueChanged = jsterm.once("set-input-value");
  EventUtils.sendString("g");
  await onJsTermValueChanged;
  is(jsterm.getInputValue(), `Dog = "Snoopy"`, "JsTerm input was updated");
  is(infoElement.textContent, "1 result", "The reverse info has the expected text");
  ok(
    !reverseSearchElement.querySelector(".search-result-button-prev") &&
    !reverseSearchElement.querySelector(".search-result-button-next"),
    "The results navigation buttons are not displayed when there's only one result"
  );

  info("Check that there's no initial value when no text is selected");
  EventUtils.synthesizeKey("KEY_Escape");
  await waitFor(() => !getReverseSearchElement(hud));

  info("Check that opening the reverse search input is empty after opening it again");
  reverseSearchElement = await openReverseSearch(hud);
  is(reverseSearchElement.querySelector("input").value, "",
    "Reverse search input is empty");
}
