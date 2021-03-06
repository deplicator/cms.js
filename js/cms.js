/*
 * CMS.js v1.0.0
 * Copyright 2015 Chris Diana
 * www.cdmedia.github.io/cms.js
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */
'use strict';

var CMS = {

  settings: {
    siteName: 'CMS.js',
    siteTagline: 'Your site tagline',
    siteEmail: 'your_email@example.com',
    siteAuthor: 'Your Name',
    siteUrl: '',
    siteNavItems: [
      { name: 'Github', href: '#', newWindow: false },
      { name: 'About' }
    ],
    pagination: 3,
    postsFolder: 'posts',
    postSnippetLength: 120,
    postSnippetSeparator: /\s*<!--\s*more\s*-->/,
    pagesFolder: 'pages',
    fadeSpeed: 300,
    mainContainer: $(document.getElementsByClassName('cms_main')),
    footerContainer: $(document.getElementsByClassName('cms_footer')),
    footerText: '&copy; ' + new Date().getFullYear() + ' All Rights Reserved.',
    parseSeperator: /[\n\r]+---\s/,
    postsOnFrontpage: true,
    pageAsFrontpage: '',
    postsOnUrl: '',
    loader: '<div class="loader">Loading...</div>',
    get siteAttributes() {
      return [
        { attr: 'title', value: CMS.settings.siteName },
        { attr: '.cms_sitename', value: CMS.settings.siteName },
        { attr: '.cms_tagline', value: CMS.settings.siteTagline },
        { attr: '.cms_footer_text', value: CMS.settings.footerText }
      ];
    },
    mode: 'Github',
    githubUserSettings: {
      username: 'yourusername',
      repo: 'yourrepo',
    },
    githubSettings: {
      branch: 'gh-pages',
      host: 'https://api.github.com'
    },
    disqus: {
      enabled: false,
      shortname: ''
    }
  },

  posts: [],
  pages: [],
  loaded: {},
  discusLoaded: false,

  extend: function (target, opts, callback) {
    var next;
    if (typeof opts === 'undefined') {
      opts = target;
      target = CMS;
    }
    for (next in opts) {
      if (Object.prototype.hasOwnProperty.call(opts, next)) {
        target[next] = opts[next];
      }
    }
    callback(); // check user config options
    return target;
  },

  updateUrl: function(key, value, url) {
    if (!url) url = window.location.href;
    var re = new RegExp("([?&])" + key + "=.*?(&|#|$)(.*)", "gi");
    var hash;

    if (re.test(url)) {
      if (typeof value !== 'undefined' && value !== null) {
        return url.replace(re, '$1' + key + "=" + value + '$2$3');
      } else {
        hash = url.split('#');
        url = hash[0].replace(re, '$1$3').replace(/(&|\?)$/, '');
        if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
          url += '#' + hash[1];
        }
        return url;
      }
    } else {
      if (typeof value !== 'undefined' && value !== null) {
        var separator = url.indexOf('?') !== -1 ? '&' : '?';
        hash = url.split('#');
        url = hash[0] + separator + key + '=' + value;
        if (typeof hash[1] !== 'undefined' && hash[1] !== null) {
          url += '#' + hash[1];
        }

        return url;
      } else {
        return url;
      }
    }
  },

  showDisqus: function(config) {
    if (CMS.discusLoaded) {
      DISQUS.reset({
        reload: true,
        config: function () {
          this.page.identifier = config.identifier;
          this.page.url = config.url;
          this.page.title = config.title;
        }
      });

    } else {
      var body = "var disqus_shortname  = \"" + CMS.settings.disqus.shortname + "\";\n" +
                 "var disqus_title = \"" + config.title + "\";\n" +
                 "var disqus_identifier = \"" + config.identifier + "\";\n" +
                 "var disqus_url = \"" + config.url + "\";\n";

      var dso = document.createElement("script");
      dso.type = "text/javascript";
      dso.async = true;
      dso.text = body;
      document.getElementsByTagName('body')[0].appendChild(dso);

      (function() {
        var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
        dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
      })();

    CMS.discusLoaded = true;
    }
  },

  render: function(url) {
    CMS.settings.mainContainer.html('').fadeOut(CMS.settings.fadeSpeed);
    CMS.settings.footerContainer.hide();

    var type = url.substr(url.lastIndexOf('/'), 6);

    var map = {

      // Main view
      '/' : function () {
        CMS.renderPosts();
      },

      // Post view
      '/?post' : function () {
        var id = url.split('?post=')[1].trim();
        CMS.renderPost(id);
      },

      // Page view
      '/?page' : function () {
        var title = url.split('?page=')[1].trim();
        CMS.renderPage(title);
      }

    };

    if (map[type]) {
      map[type]();
    } else {
      // Error view
      var errorMsg = 'Error loading page.';
      CMS.renderError(errorMsg);
    }
  },

  renderPage: function(title) {
    CMS.pages.sort(function(a, b) { return CMS.settings.sortDateOrder ? b.date - a.date : a.date - b.date; });
    CMS.pages.forEach(function(page) {
      if (page.title == title.replace(/%20/g, " ")) {

        var tpl = $(document.getElementById('page-template')).html();
        var $tpl = $(tpl);

        $tpl.find('.page-title').html(page.title);
        $tpl.find('.page-content').html(page.contentData);

        CMS.settings.mainContainer.html($tpl).hide().fadeIn(CMS.settings.fadeSpeed);
      }
    });
    CMS.renderFooter();
  },

  renderPost: function(id) {
    CMS.posts.forEach(function(post) {
      if (post.id == id) {

        var tpl = $(document.getElementById('post-template')).html();
        var $tpl = $(tpl);

        $tpl.find('.post-title').html(post.title);
        $tpl.find('.post-date').html((post.date.getMonth() + 1) + '/' + post.date.getDate() + '/' +  post.date.getFullYear());
        $tpl.find('.post-content').html(post.contentData);
        if(CMS.settings.disqus.enabled) {
          $tpl.find('#disqus_thread').show();
          var config = {
            title: 'post: ' + post.title,
            identifier: post.comments,
            url: window.location.href.split('#')[0] + window.location.hash.slice(1),
          };
          CMS.showDisqus(config);
        }

        CMS.settings.mainContainer.html($tpl).hide().fadeIn(CMS.settings.fadeSpeed);
      }
    });
    CMS.renderFooter();
  },

  renderPosts: function() {
    CMS.posts.sort(function(a, b) { return CMS.settings.sortDateOrder ? b.date - a.date : a.date - b.date; });
    CMS.posts.forEach(function(post) {
      var tpl = $(document.getElementById('post-template')).html();
      var $tpl = $(tpl);

      var title = '<a href="#">' + post.title + '</a>';
      var date = (post.date.getUTCMonth() + 1) + '/' + post.date.getUTCDate() + '/' +  post.date.getUTCFullYear();
      var snippet = '';
      if(typeof CMS.settings.postSnippetSeparator === 'object' || typeof CMS.settings.postSnippetSeparator === 'string') {
        snippet = post.contentData.split(CMS.settings.postSnippetSeparator)[0];
      }

      var postLink = $tpl.find('.post-title');
      var postDate = $tpl.find('.post-date');
      var postSnippet = $tpl.find('.post-content');

      postLink.on('click', function(e) {
        e.preventDefault();
        window.location.href = CMS.updateUrl('post', post.id);
        $(window).trigger('hashchange');
      });

      $tpl.append('<a href="#">read more...</a>').on('click', function(e) {
        e.preventDefault();
        window.location.href = CMS.updateUrl('post', post.id);
        $(window).trigger('hashchange');
      });

      postLink.html(title);
      postSnippet.html(snippet);
      postDate.html(date);

      CMS.settings.mainContainer.append($tpl).hide().fadeIn(CMS.settings.fadeSpeed);
    });
    CMS.renderFooter();
  },

  renderFooter: function () {
    // Delay footer loading while waiting on ajax requests
    setTimeout(function () {
      CMS.settings.footerContainer.fadeIn(CMS.settings.fadeSpeed);
    }, 800);
  },

  renderError: function (msg) {
    var tpl = $(document.getElementById('error-template')).html(),
      $tpl = $(tpl);

    $tpl.find('.error_text').html(msg);

    CMS.settings.mainContainer.html('').fadeOut(CMS.settings.fadeSpeed, function () {
      CMS.settings.mainContainer.html($tpl).fadeIn(CMS.settings.fadeSpeed);
    });
  },

  contentLoaded: function (type) {

    CMS.loaded[type] = true;

    if (CMS.loaded.page && CMS.loaded.post) {

      // Set navigation
      this.setNavigation();

      // Manually trigger on initial load
      $(window).trigger('hashchange');
    }
  },

  parseContent: function(content, type, file, counter, numFiles) {

    var data;
    var yamlSeperation = CMS.settings.parseSeperator.exec(content);
    var contentObj = {};
    var id = counter;
    var date = file.date;

    contentObj.id = id;
    contentObj.date = date;

    // If null there is no front matter on this page/post.
    if (yamlSeperation !== null) {
      data = content.substr(yamlSeperation.index + 5, content.length);

      // Get content info
      var infoData = content.substr(3, yamlSeperation.index - 3).split(/[\n\r]+/);

      $.each(infoData, function (k, v) {
        if (v.length) {
          v.replace(/^\s+|\s+$/g, '').trim();
          var i = v.split(':');
          var val = v.slice(v.indexOf(':')+1);
          k = i[0];

          val = (k == 'date' ? (new Date(val)) : val);

          // To create a link for disqus comments.
          if (k === 'title') {
            contentObj['comments'] = type + '/' + val.trim().replace(/\s/g,'-').toLowerCase();
          }

          contentObj[k] = (val.trim ? val.trim() : val);
        }
      });
    } else {
      data = content;
    }

    // Put everything back together if broken
    contentObj.contentData = marked(data);

    switch(type) {
      case 'post':
        CMS.posts.push(contentObj);
        break;
      case 'page':
        CMS.pages.push(contentObj);
        break;
    }

    // Execute after all content is loaded
    if (counter === numFiles) {
      CMS.contentLoaded(type);
    }
  },

  getContent: function (type, file, counter, numFiles) {

    var urlFolder = '',
      url;

    switch(type) {
      case 'post':
        urlFolder = CMS.settings.postsFolder;
        break;
      case 'page':
        urlFolder = CMS.settings.pagesFolder;
        break;
    }

    if (CMS.settings.mode == 'Github') {
      url = file.link;
    } else {
      url = file.name.indexOf(urlFolder) > -1 ? file.name : urlFolder + '/' + file.name;
    }

    $.ajax({
      type: 'GET',
      url: url,
      dataType: 'html',
      success: function (content) {
        CMS.parseContent(content, type, file, counter, numFiles);
      },
      error: function () {
        var errorMsg = 'Error loading ' + type + ' content';
        CMS.renderError(errorMsg);
      }
    });
  },

  getFiles: function(type) {

    var folder = '';
    var url = '';

    switch(type) {
      case 'post':
        folder = CMS.settings.postsFolder;
        break;
      case 'page':
        folder = CMS.settings.pagesFolder;
        break;
    }

    if (CMS.settings.mode == 'Github') {
      var gus = CMS.settings.githubUserSettings;
      var gs = CMS.settings.githubSettings;
      url = gs.host + '/repos/' + gus.username + '/' + gus.repo + '/contents/' + folder + '?ref=' + gs.branch;
    } else {
      url = folder;
    }

    $.ajax({
      url: url,
      success: function (data) {
        var files = [];
        var linkFiles;
        var dateParser = /\d{4}-\d{2}(?:-\d{2})?/; // can parse both 2016-01 and 2016-01-01

        if (CMS.settings.mode == 'Github') {
          linkFiles = data;
        } else {
          linkFiles = $(data).find('a');
        }

        $(linkFiles).each(function (k, f) {

          var filename;
          var downloadLink;

          if (CMS.settings.mode == 'Github') {
            filename = f.name;
            downloadLink = f.download_url;
          } else {
            filename = $(f).attr('href');
          }

          if (filename.split('.').pop() === 'md') {
            var file = {};
            file.date = new Date(dateParser.test(filename) && dateParser.exec(filename)[0]);
            file.name = filename;
            if (downloadLink) {
              file.link = downloadLink;
            }
            files.push(file);
          }

        });

        var counter = 0;
        var numFiles = files.length;

        if (numFiles > 0) {
          for (var file of files) {
            counter++;
            CMS.getContent(type, file, counter, numFiles);
          }
        } else {
          var errorMsg = 'Error loading ' + type + 's in directory. Make sure ' +
            'there are Markdown ' + type + 's in the ' + type + 's folder.';
          CMS.renderError(errorMsg);
        }
      },
      error: function () {
        var errorMsg;
        if (CMS.settings.mode == 'Github') {
          errorMsg = 'Error loading ' + type + 's directory. Make sure ' +
            'your Github settings are correctly set in your config.js file.';
        } else {
          errorMsg = 'Error loading the ' + type + 's directory. Make sure ' +
            'the ' + type + 's directory is set correctly in config and  ' +
            'the ' + type + 's directory indexing feature is enabled.';
        }
        CMS.renderError(errorMsg);
      }
    });
  },

  setNavigation: function() {

    $('.cms_sitename').on('click', function(e) {
      e.preventDefault();
      window.location.href = window.location.origin + window.location.pathname;
      $(window).trigger('hashchange');
    });

    var navBuilder = ['<ul>'];
    CMS.settings.siteNavItems.forEach(function (navItem) {
      if (navItem.hasOwnProperty('href')) {
        navBuilder.push('<li><a href="', navItem.href, '"');
        if (navItem.hasOwnProperty('newWindow') && navItem.newWindow) {
          navBuilder.push('target="_blank"');
        }
        navBuilder.push('>', navItem.name, '</a></li>');
      } else {
        CMS.pages.forEach(function (page) {
          if (navItem.name == page.title) {
            navBuilder.push('<li><a href="#" class="cms_nav_link" id="', navItem.name, '">', navItem.name, '</a></li>');
          }
        });
      }
    });
    navBuilder.push('</ul>');
    var nav = navBuilder.join('');

    $(document.getElementsByClassName('cms_nav')).html(nav);

    // Set onclicks for nav links
    $.each($(document.getElementsByClassName('cms_nav_link')), function (k, link) {
      var title = $(this).attr('id');
      $(this).on('click', function (e) {
          e.preventDefault();
          window.location.href = CMS.updateUrl('page', title);
          $(window).trigger('hashchange');
      });
    });
  },

  setSiteAttributes: function () {
    CMS.settings.siteAttributes.forEach(function(attribute) {

      var value;

      // Set brand
      if (attribute.attr == '.cms_sitename' && attribute.value.match(/\.(jpeg|jpg|gif|png)$/)) {
        value = '<img src="' + attribute.value + '" />';
      } else {
        value = attribute.value;
      }
      $(attribute.attr).html(value).hide().fadeIn(CMS.settings.fadeSpeed);
    });
  },

  generateSite: function () {

    this.setSiteAttributes();

    var types = ['post', 'page'];

    types.forEach(function (type) {
      CMS.getFiles(type);
    });

    // Check for hash changes
    $(window).on('hashchange', function () {
      CMS.render(window.location.href);
    });
  },

  init: function (options) {
    if (!(options instanceof Array)) {
      return this.extend(this.settings, options, function () {
        CMS.generateSite();
      });
    }
  }

};
