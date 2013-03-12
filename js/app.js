$(function(){
	
	//views
	
		var SearchView = Backbone.View.extend({
			el: $('#search'),
			template: _.template($('#search-template').html()),
			events: {
				"submit form" : "search"
			}, 
			initialize: function() {
				_.bindAll(this, "search");
				this.render();
			},
			render: function() {
				$(this.el).html(this.template());
			},
			search: function() {
				var query = $('input#query').val();
				query.replace(/\s+/g, '+').toLowerCase();
				//check if url or tag
				if (query.indexOf('.') > -1) {
					app.navigate("/"+query+"", {trigger: true});
				} else {
					app.navigate("/tagged/"+query+"", {trigger: true});
				}
				return false;
			}
		});
		
		var TumblrView = Backbone.View.extend({
			el: $('#gifs'),
			template: _.template($('#gif-template').html()),
			events: {
				"click img" : "next"
			},
			initialize: function() {
				_.bindAll(this, "fetchGifs", "next", "previous", "keydown", "fetchMoreGifs", "firstGif");
				$(document).on('keydown', this.keydown);
				$('.empty').empty();
				this.fetchGifs();
			},
			fetchGifs: function() {				
				var self = this;
				if (this.options.url) {
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
					fetchTumblrGifs = function(data) {
						console.log(data)
						if (data.meta.status === 200) {
							var posts = data.response.posts;
							for (var i = 0; i < posts.length; i++) {
								var photos = posts[i].photos;
								var tags = posts[i].tags;
								console.log(tags)
								self.render(photos,tags);
							}
							if (posts.length === 50) {
								self.fetchMoreGifs(data.response.total_posts);
							}
						} else if (data.meta.status === 404) {
						  	new ErrorView({
								title: "Bummer Bro",
								message: ""+self.options.url+" doesn't appear to be a tumblr."
							});
						}
					}
					self.firstGif();
				}
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
					fetchTagGifs = function(data) {
						var posts = data.response;
						for (var i = 0; i < posts.length; i++) {
							if (posts[i].photos) {
								var photos = posts[i].photos;
								var tags = posts[i].tags;
								self.render(photos,tags);
							}
						}
						self.firstGif();
						if (posts.length > 0) {
							var last = data.response[data.response.length-1];
							var timeStamp = last.timestamp;
							self.fetchMoreGifs(timeStamp);
						}
					}
				}
			},
			render: function(photos,tags) {
				var self = this;
				for (var i = 0; i < photos.length; i++) {
					var data = {
						src: photos[i].original_size.url,
					}
					$(self.el).append(self.template(data));
				}
			},
			next: function() {
				console.log('next')
				var current = $('#gifs .active');
				current.addClass('hide').removeClass('active');
				var next = current.next('img');
				if (next.length > 0) {
					if (next.hasClass('unloaded')) {
						var src = next.attr('id');
						next.attr('src', src);
						next.removeClass('unloaded');
					}
					next.removeClass('hide').addClass('active');
					var nextLoad = $('#gifs img.unloaded:first');
					if (nextLoad.length > 0) {
						var src = nextLoad.attr('id');
						nextLoad.attr('src', src);
						nextLoad.removeClass('unloaded');
					}
				} else {
					$('#gifs img:first').removeClass('hide').addClass('active');
				}
			},
			previous: function() {
				console.log('previous')
				var current = $('#gifs .active');
				current.addClass('hide').removeClass('active');
				var next = current.prev('img');
				if (next.length > 0) {
					if (next.hasClass('unloaded')) {
						var src = next.attr('id');
						next.attr('src', src);
						next.removeClass('unloaded');
					}
					next.removeClass('hide').addClass('active');
					var nextLoad = $('#gifs img.unloaded:last');
					if (nextLoad.length > 0) {
						var src = nextLoad.attr('id');
						nextLoad.attr('src', src);
						nextLoad.removeClass('unloaded');
					}
				} else {
					var last = $('#gifs img:last');
					if (last.hasClass('unloaded')) {
						var src = last.attr('id');
						last.attr('src', src);
						last.removeClass('unloaded');
					}
					$('#gifs img:last').removeClass('hide').addClass('active');
				}
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
			fetchMoreGifs: function(count) {
				var self = this;
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
					fetchMoreTumblrGifs = function(data) {
						var data = data.response.posts;
						for (var i = 0; i < data.length; i++) {
							var photos = data[i].photos;
							self.render(photos);
						}
					}
				}
				if (this.options.tag) {
					$.ajax({
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
					fetchMoreTagGifs = function(data) {
						var posts = data.response;
						for (var i = 0; i < posts.length; i++) {
							if (posts[i].photos) {
								var photos = posts[i].photos;
								var tags = posts[i].tags;
								self.render(photos,tags);
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
			firstGif: function() {
				//load first 5
				$("#gifs img").slice(0, 5).each(function() {
					var src = $(this).attr('id');
					$(this).attr('src', src);
					$(this).removeClass('unloaded');
				});
				//first gif
				var first = $("#gifs img:first");
				first.addClass('active').removeClass('hide');
			}
		});
		
		//error view
		ErrorView = Backbone.View.extend({
			el: $('#error'),
			template: _.template($('#error-template').html()),
			initialize: function() {
			    _.bindAll(this);
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
		
		
	//end views	
	
	//router
	
		var AppRouter = Backbone.Router.extend({
			routes: {
				"" : "home",
				":url" : "tumblr",
				"tagged/:tag" : "tag"
			},
			initialize: function() {

		    },
			home: function() {
				new SearchView();
			},
			tumblr: function(url) {
				new TumblrView({
					url: url
				});
			},
			tag: function(tag) {
				new TumblrView({
					tag: tag
				});
			}
		});
	
		var app = new AppRouter();
		Backbone.history.start();
		
	// end router
	
});

