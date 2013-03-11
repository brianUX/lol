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
				app.navigate("/tumblr/"+query+"", {trigger: true});
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
				_.bindAll(this, "fetchGifs", "next", "previous", "keydown", "fetchMoreGifs");
				$(document).on('keydown', this.keydown);
				$('.empty').empty();
				this.fetchGifs();
			},
			fetchGifs: function() {				
				var self = this;
				if (this.options.url) {
					var url = "http://api.tumblr.com/v2/blog/" + this.options.url + "/posts?type=photo&limit=50";
					$.ajax({
					    type: 'GET',
					    url: url,
					    dataType: 'jsonp',
					    data: {
					        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
					        jsonp: 'fetchTumblrGifs'
					    }
					});
					fetchTumblrGifs = function(data) {
						self.fetchMoreGifs(data.response.total_posts);
						var data = data.response.posts;
						for (var i = 0; i < data.length; i++) {
							var photos = data[i].photos;
							self.render(photos);
						}
					}
				}
				if (this.options.tag) {
					var url = "http://api.tumblr.com/v2/tagged?tag=" + this.options.tag + "&limit=50";
					$.ajax({
					    type: 'GET',
					    url: url,
					    dataType: 'jsonp',
					    data: {
					        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
					        jsonp: 'fetchTagGifs'
					    }
					});
					fetchTagGifs = function(data) {
						if (data.response.length > 0) {
							var last = data.response[data.response.length-1];
							var timeStamp = last.timestamp;
							var size = $('#gifs img').size();
							if (size < 100) {
								self.fetchMoreGifs(timeStamp);
							} else {
								return false;
							}
						}
						var data = data.response;
						for (var i = 0; i < data.length; i++) {
							if (data[i].photos) {
								var photos = data[i].photos;
								self.render(photos);
							}
						}
					}
				}
			},
			render: function(photos) {
				var self = this;
				for (var i = 0; i < photos.length; i++) {
					var data = {
						src: photos[i].original_size.url
					}
					$(self.el).append(self.template(data));
				}
				//load first 5
				$("#gifs img").slice(0, 5).each(function() {
					var src = $(this).attr('id');
					$(this).attr('src', src);
					$(this).removeClass('unloaded');
				});
				//first image
				var first = $('#gifs img:first');
				first.removeClass('hide');
			},
			next: function() {
				var current = $('#gifs img:visible');
				var next = current.next('img');
				if (next.length > 0) {
					current.addClass('hide');
					if (next.hasClass('unloaded')) {
						var src = next.attr('id');
						next.attr('src', src);
						next.removeClass('unloaded');
					}
					next.removeClass('hide');
					var nextLoad = $('#gifs img.unloaded:first');
					if (nextLoad.length > 0) {
						var src = nextLoad.attr('id');
						nextLoad.attr('src', src);
						nextLoad.removeClass('unloaded');
					}
				} else {
					current.addClass('hide');
					$('#gifs img:first').removeClass('hide');
				}
			},
			previous: function() {
				var current = $('#gifs img:visible');
				var next = current.prev('img');
				if (next.length > 0) {
					current.addClass('hide');
					if (next.hasClass('unloaded')) {
						var src = next.attr('id');
						next.attr('src', src);
						next.removeClass('unloaded');
					}
					next.removeClass('hide');
					var nextLoad = $('#gifs img.unloaded:last');
					if (nextLoad.length > 0) {
						var src = nextLoad.attr('id');
						nextLoad.attr('src', src);
						nextLoad.removeClass('unloaded');
					}
				} else {
					current.addClass('hide');
					var last = $('#gifs img:last');
					if (last.hasClass('unloaded')) {
						var src = last.attr('id');
						last.attr('src', src);
						last.removeClass('unloaded');
					}
					$('#gifs img:last').removeClass('hide');
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
						console.log(i)
						var url = "http://api.tumblr.com/v2/blog/" + this.options.url + "/posts?type=photo&limit=50&offset=" + i + ""
						$.ajax({
						    type: 'GET',
						    url: url,
						    dataType: 'jsonp',
						    data: {
						        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
						        jsonp: 'fetchMoreTumblrGifs'
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
					var url = "http://api.tumblr.com/v2/tagged?tag=" + this.options.tag + "&before=" + count + "";
					$.ajax({
					    type: 'GET',
					    url: url,
					    dataType: 'jsonp',
					    data: {
					        api_key: 'fmCi0cMluKIabZEGPyUmaX3pDMA6VApivcTN6artFbU405Sv3K',
					        jsonp: 'fetchTagGifs'
					    }
					});
				}
			}
		});
		
		
	//end views	
	
	//router
	
		var AppRouter = Backbone.Router.extend({
			routes: {
				"" : "home",
				"tumblr/:url" : "tumblr",
				"tumblr/tagged/:tag" : "tag"
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
		Backbone.history.start({ pushState: true })
		
	// end router
	
});

function yep (data) {
	console.log(data)
}