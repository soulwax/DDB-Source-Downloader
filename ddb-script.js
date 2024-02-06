/* globals jQuery, $ */
// ==UserScript==
// @name         DDB Book Downloader Enhanced
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Save your DDB books to PDF with improved content loading!
// @author       Enhanced by Code Wizard
// @match        https://www.dndbeyond.com/sources/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dndbeyond.com
// @require      https://code.jquery.com/jquery-3.6.3.min.js
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  $(document).ready(function () {
    let bookTitle = document.title;
    let contentStorage = {};
    let contentOrder = [];

    function fetchPageContent(url, index) {
      return $.get(url, function (data) {
        let pageContent = $("<div>")
          .append($.parseHTML(data))
          .find(".p-article-content")
          .html();
        contentStorage[index] = pageContent;
      });
    }

    function compileBook() {
      let compiledContent = contentOrder
        .map((index) => contentStorage[index])
        .join('<div style="page-break-after: always;"></div>');
      return (
        "<!DOCTYPE html>" +
        '<html lang="en"><head><meta charset="UTF-8"><title>' +
        bookTitle +
        "</title>" +
        '<link rel="stylesheet" href="https://www.dndbeyond.com/content/1-0-2352-0/skins/blocks/css/compiled.css"/>' +
        '<link rel="stylesheet" href="https://www.dndbeyond.com/content/1-0-2352-0/skins/waterdeep/css/compiled.css"/>' +
        '<link rel="stylesheet" type="text/css" href="https://www.dndbeyond.com/api/custom-css" />' +
        "<style>body {width: 850px; margin-left:30px;}</style>" +
        "</head><body>" +
        compiledContent +
        "</body></html>"
      );
    }

    $(".compendium-toc-full-text a")
      .not('[href*="#"]')
      .each(function (index) {
        let href = $(this).attr("href");
        contentOrder.push(index);
        fetchPageContent(href, index);
      });

    $('<button id="compilePDF" type="button">Compile PDF</button>')
      .insertBefore(".compendium-toc-full-text")
      .on("click", function () {
        $.when
          .apply(
            $,
            Object.keys(contentStorage).map((key) => contentStorage[key])
          )
          .then(function () {
            let bookContent = compileBook();
            let newWindow = window.open();
            newWindow.document.open();
            newWindow.document.write(bookContent);
            newWindow.document.close();
            $("#compilePDF").prop("disabled", true).text("PDF Compiled");
          });
      });
  });
})();
