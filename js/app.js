$(function(){
	
	//views
	
		SearchView = Backbone.View.extend({
			el: $('#search'),
			template: _.template($('#search-template').html()),
			events: {
				"submit form" : "search",
				"click a" : "toggleInput"
			}, 
			initialize: function() {
				_.bindAll(this, "search", "toggleInput");
				this.render();
			},
			render: function() {
				$(this.el).html(this.template());
			},
			search: function() {
				var query = $('input#query').val();
				query.replace(/\s+/g, '+').toLowerCase();
				//check if url or tag
			    app.navigate("#/"+query+"", {trigger: true});
				return false;
			},
			toggleInput: function() {
				var x = $("input#query");
				x.toggle();
				if (x.is(":visible")) {
					x.focus();
					x.val("");
				}
			}
		});
		
		TumblrView = Backbone.View.extend({
			el: $('#gifs'),
			template: _.template($('#gif-template').html()),
			events: {
				"click img" : "next"
			},
			initialize: function() {
				_.bindAll(this, "fetchGifs", "next", "previous", "keydown", "fetchMoreGifs", "firstGif", "reset", "fetchRedditGifs");
				$(document).on('keydown', this.keydown);
				$('.empty').empty();
				this.fetchGifs();
				new LoadingView();
				this.checkInput();
				new PageView();
			},
			fetchGifs: function() {				
				var self = this;
				//tumblr
				if (this.options.url) {
					//update url
					$.ajax({
					    type: 'GET',
					    url: "http://api.tumblr.com/v2/blog/" + this.options.url + "/posts?",
					    dataType: 'jsonp',
					    data: {
					        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
					        jsonp: 'fetchTumblrGifs',
							type: 'photo',
							limit: '50'
					    }
					});
					//callback
					fetchTumblrGifs = function(data) {
						if (data.meta.status === 200) {
							var posts = data.response.posts;
							for (var i = 0; i < posts.length; i++) {
								var photos = posts[i].photos;
								var tags = posts[i].tags;
								self.render(photos,tags,0,1);
							}
							if (posts.length === 50) {
								self.fetchMoreGifs(data.response.total_posts);
							}
							if (posts.length < 1) {
								new ErrorView({
									title: "Bummer",
									message: ""+self.options.url+" doesn't have any gifs."
								});
							}
						} else if (data.meta.status === 404) {
						  	new ErrorView({
								title: "Aw, Man.",
								message: ""+self.options.url+" doesn't appear to be a tumblr."
							});
						}
					}
				}
				//tag
				if (this.options.tag) {
					$.ajax({
					    type: 'GET',
					    url: "http://api.tumblr.com/v2/tagged?",
					    dataType: 'jsonp',
					    data: {
					        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
					        jsonp: 'fetchTagGifs',
							tag: this.options.tag 
					    }
					});
					//callback
					fetchTagGifs = function(data) {
						var posts = data.response;
						for (var i = 0; i < posts.length; i++) {
							if (posts[i].photos) {
								var photos = posts[i].photos;
								var tags = posts[i].tags;
								self.render(photos,tags,0,1);
							}
						}
						if (posts.length > 0) {
							var last = data.response[data.response.length-1];
							var timeStamp = last.timestamp;
							self.fetchMoreGifs(timeStamp);
						}
						if (posts.length < 1) {
							self.fetchRedditGifs();
						}
					}
				}
			},
			fetchMoreGifs: function(count) {
				var self = this;
				if (this.ajaxClear) {
					$("#gifs").empty();
					return false;
				}
				//tumblr
				if (this.options.url) {
					for (var i = 50; i < count; i = i+50) {
						$.ajax({
						    type: 'GET',
						    url: "http://api.tumblr.com/v2/blog/" + this.options.url + "/posts?",
						    dataType: 'jsonp',
						    data: {
						        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
						        jsonp: 'fetchMoreTumblrGifs',
								type: 'photo',
								limit: '50',
								offset: i
						    }
						});
					}
					//callback
					fetchMoreTumblrGifs = function(data) {
						var posts = data.response.posts;
						for (var i = 0; i < posts.length; i++) {
							var photos = posts[i].photos;
							var tags = posts[i].tags;
							self.render(photos,tags,1,1);
						}
					}
				}
				//tag
				if (this.options.tag) {
					self.fetchMoreTagsAjax = $.ajax({
					    type: 'GET',
					    url: "http://api.tumblr.com/v2/tagged?",
					    dataType: 'jsonp',
					    data: {
					        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
					        jsonp: 'fetchMoreTagGifs',
							tag: this.options.tag,
							before: count
					    }
					});
					//callback
					fetchMoreTagGifs = function(data) {
						var posts = data.response;
						for (var i = 0; i < posts.length; i++) {
							if (posts[i].photos) {
								var photos = posts[i].photos;
								var tags = posts[i].tags;
								self.render(photos,tags,1,1);
							}
						}
						if (data.response.length > 0) {
							var last = data.response[data.response.length-1];
							var timeStamp = last.timestamp;
							var size = $('#gifs img').size();
							if (size < 200) {
								self.fetchMoreGifs(timeStamp);
							} else {
								return false;
							}
						}
					}
				}
			},
			fetchRedditGifs: function() {
				var self = this;
				var url = "http://www.reddit.com/search.json?q=" + this.options.tag + "+gif&sort=hot&restrict_sr=off&limit=100&t=all&jsonp=?";
				console.log(url)
				$.getJSON(url, {format: "jsonp"}, 
					function(data) {
						var gifs = data.data.children;
						self.render(gifs,null,0,2);
			    	}
				).error(function() {
					new ErrorView({
						title: "Bummer.",
						message: "Couldn't find any <strong>"+self.options.tag+"</strong> gifs."
					});
				});
			},
			render: function(photos,tags,first,source) {
				var self = this;
				if (source === 1) {
					for (var i = 0; i < photos.length; i++) {
						if (photos[i].original_size.url.indexOf('.gif') > 0) {
							var data = {
								src: photos[i].original_size.url,
								tags: tags
							}
							$(self.el).append(self.template(data));
						}
						self.firstGif();
					}
				} else if (source === 2) {
					for (var i = 0; i < photos.length; i++) {
						if (photos[i].data.url.indexOf('.gif') > 0) {
							var data = {
								src: photos[i].data.url,
								tags: [""+this.options.tag+""]
							}
							$(self.el).append(self.template(data));
						}
						self.firstGif();
					}
				}
			},
			next: function() {
				var current = $('#gifs .active');
				current.addClass('hide');
				current.removeClass('active');
				var next = current.next('.gif');
				if (next.length > 0) {
					if (next.hasClass('unloaded')) {
						var src = next.attr('id');
						next.find('img').attr('src', src);
						next.removeClass('unloaded');
					}
					next.removeClass('hide').addClass('active');
					var nextLoad = $('#gifs .unloaded:first');
					if (nextLoad.length > 0) {
						var src = nextLoad.attr('id');
						nextLoad.find('img').attr('src', src);
						nextLoad.removeClass('unloaded');
					}
				} else {
					$('#gifs .gif:first').removeClass('hide').addClass('active');
				}
				if ($("input#query").is(":visible")) {
					$("input#query").hide();
				}
				new PageView();
			},
			previous: function() {
				var current = $('#gifs .active');
				current.addClass('hide').removeClass('active');
				var next = current.prev('.gif');
				if (next.length > 0) {
					if (next.hasClass('unloaded')) {
						var src = next.attr('id');
						next.find('img').attr('src', src);
						next.removeClass('unloaded');
					}
					next.removeClass('hide').addClass('active');
					var nextLoad = $('#gifs .unloaded:last');
					if (nextLoad.length > 0) {
						var src = nextLoad.attr('id');
						nextLoad.find('img').attr('src', src);
						nextLoad.removeClass('unloaded');
					}
				} else {
					var last = $('#gifs .gif:last');
					if (last.hasClass('unloaded')) {
						var src = last.attr('id');
						last.find('img').attr('src', src);
						last.removeClass('unloaded');
					}
					last.removeClass('hide').addClass('active');
				}
				if ($("input#query").is(":visible")) {
					$("input#query").hide();
				}
				new PageView();
			},
			keydown: function(e) {
				var self = this;
				if (e.keyCode == 39) {
					self.next();
				} 
				if (e.keyCode == 37) {
					self.previous();
				}
			},
			firstGif: function() {
				if ($("#gifs .active")[0]) {
					return false;
				} else {
					//load first 5
					$("#gifs .gif").slice(0, 5).each(function() {
						var src = $(this).attr('id');
						$(this).find('img').attr('src', src);
						$(this).removeClass('unloaded');
					});
					//show first gif
					var first = $("#gifs .gif:first");
					first.addClass('active').removeClass('hide');
					//show alert
					new AlertView();
				}
			},
			checkInput: function() {
				var x = $("input#query");
				x.toggle();
				if (x.is(":visible")) {
					x.hide();
					x.val("");
				}
			},
			reset: function() {
				$(document).unbind('keydown', this.keydown);
				this.ajaxClear = 1;
			}
		});
		
		//loading view
		LoadingView = Backbone.View.extend({
			initialize: function() {
				var opts = {
				  lines: 12, // The number of lines to draw
				  length: 42, // The length of each line
				  width: 20, // The line thickness
				  radius: 74, // The radius of the inner circle
				  corners: 0.1, // Corner roundness (0..1)
				  rotate: 0, // The rotation offset
				  color: '#999', // #rgb or #rrggbb
				  speed: 0.7, // Rounds per second
				  trail: 100, // Afterglow percentage
				  shadow: false, // Whether to render a shadow
				  hwaccel: false, // Whether to use hardware acceleration
				  className: 'spinner', // The CSS class to assign to the spinner
				  zIndex: 0, // The z-index (defaults to 2000000000)
				  top: 'auto', // Top position relative to parent in px
				  left: 'auto' // Left position relative to parent in px
				};
				var target = document.getElementById('loading');
				var spinner = new Spinner(opts).spin(target);
			}
		});
		
		//error view
		ErrorView = Backbone.View.extend({
			el: $('#error'),
			template: _.template($('#error-template').html()),
			initialize: function() {
			    _.bindAll(this);
				$("#loading").remove();
			    $('.empty').empty();
				this.render();
			},
			render: function() {
				var data = {
					title: this.options.title,
					message: this.options.message
				};
			  	$(this.el).html(this.template(data));
			}
		});
		
		//alert view
		AlertView = Backbone.View.extend({
			el: $('#alert'),
			template: _.template($('#alert-template').html()),
			initialize: function() {
			    _.bindAll(this, "remove");
				this.render();
			},
			render: function() {
				var self = this;
			  	$(this.el).html(this.template());
				$(window).one("click", function() {
					self.remove();
				});
				$(document).on('keydown', self.remove);
			},
			remove: function() {
				$('#alert').fadeOut();
			}
		});
		
		//page view
		PageView = Backbone.View.extend({
			initialize: function() {
				_gaq.push(['_trackPageview', window.location.href]);
			}
		})
		
	//end views	
	
	//router
	
		AppRouter = Backbone.Router.extend({
			routes: {
				"" : "home",
				":query" : "tumblr",
				"http://:query" : "tumblr"
			},
			initialize: function() {
				new SearchView();
				this.params();
		    },
			home: function() {
				this.tumblr(0);
			},
			tumblr: function(query) {
				if (query === 0) {
					var query = "gif"
				} 
				if (this.url) {
					var query = this.url;
				}
				if (this.currentTumblrView) {
					this.currentTumblrView.reset();
					this.currentTumblrView.undelegateEvents(); 
				}
				if (query.indexOf('.') > -1) {
					if (query.indexOf('http://') > -1) {
						query.replace("http://", "");
					}
					var view = new TumblrView({
						url: query
					});
				} else {
					var view = new TumblrView({
						tag: query
					});
				}
				this.currentTumblrView = view;
			},
			params: function() {
				var self = this;
				var urlParams = {};
				(function() {
				    var e,
				        a = /\+/g,  // Regex for replacing addition symbol with a space
				        r = /([^&=]+)=?([^&]*)/g,
				        d = function(s) { return decodeURIComponent(s.replace(a, ' ')); },
				        q = window.location.search.substring(1);

				    while (e = r.exec(q))
				       urlParams[d(e[1])] = d(e[2]);
				})();
				this.url = urlParams['url'];
			}
		});
	
		app = new AppRouter();
		Backbone.history.start();
		
	// end router
	
});

