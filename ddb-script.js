/* globals jQuery, $, waitForKeyElements */
// ==UserScript==
// @name         DDB Book Downloader
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Save your DBB books to PDF!
// @author       C T Zaran (and shanix)
// @match        https://www.dndbeyond.com/sources/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dndbeyond.com
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @grant        none
// ==/UserScript==

$().ready(function () {
  localStorage.clear(); // We need to clear the localStorage, else our PDF is going to be fubar.

  // Reworked how we get pages.  First we get all the 'compendiums' (i.e. each of the blocks of links),
  // then we iterate over all the anchors that don't include a # (which indicates a header, not the whole page),
  // and save those to an array.  Should get everything.  Hopefully.  Theoretically.  Probably.
  let book_title = $(document).attr("title");
  let raw_compendiums = $(".compendium-toc-full-text");
  let compendium_pages = [];
  raw_compendiums.each(function (i, obj) {
    $(obj)
      .find("a")
      .each(function () {
        if (!$(this).attr("href").includes("#")) {
          compendium_pages.push($(this).attr("href"));
        }
      });
  });

  let first_compendium = raw_compendiums[0];
  let new_book_contents =
    '<div><button class="doPDF" type="button">Do PDF</button></div>' +
    $(first_compendium).html(); // Add a button before our original HTML
  $(first_compendium).html(new_book_contents); // Restore our book contents

  let last_page = 0; // Default for our last page variable
  $(compendium_pages).each(function (i, v) {
    //Cycle all our pages, we want to know what page number we are (starting at 0, becuase arrays start at 0).
    $.get(v, function (data) {
      //Here, we are getting the page data from the URL for each page of our book.
      let pageData = $(data).find(".p-article-content").html(); //Grab just the page contents we care about
      localStorage.setItem(i, pageData); //Now we save the HTML for our page to our local storage for later
    });
    last_page = i; //Set last page to be our i (index) number for later. Will always be the last page once this loop is completed.
  });

  $(".doPDF").on("click", function () {
    // Lets start building our book!

    let open_book = window.open();
    // We need to hijack the DBB CSS or else our book looks bad.
    let book_HTML =
      "<!DOCTYPE html>" +
      '<html lang="en-us" class="no-js">' +
      '<meta charset="UTF-8">' +
      "<title>" +
      book_title +
      "</title>" +
      '<link rel="stylesheet" href="https://www.dndbeyond.com/content/1-0-2352-0/skins/blocks/css/compiled.css"/>' +
      '<link rel="stylesheet" href="https://www.dndbeyond.com/content/1-0-2352-0/skins/waterdeep/css/compiled.css"/>' +
      '<link rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/api/custom-css" />' +
      "<style>body {width: 850px; margin-left:30px}</style>";

    // Lets loop our pages, while our current page is less than or equal to our last page, grab that previously saved data and add it to our book
    let current_page = 0; // Default current page for later.
    while (current_page <= last_page) {
      book_HTML += localStorage.getItem(current_page);
      book_HTML +=
        '<div style = "display:block; clear:both; page-break-after:always;"></div>';
      current_page += 1; // Bump current page number up by 1.
    }

    book_HTML = book_HTML + "</html>"; //Close our our HTML tag or browsers will get funny about it.

    open_book.document.write(book_HTML); //Open tab with our Book!
    $(this)
      .attr("disabled", true)
      .text("PDF Done, refresh page to generate again"); //Disable the button, just prevents oddites from occuring with running this more than once per refresh.
  });
});
