/*
   Copyright 2011-2014 Lukas Vlcek

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// Override jQuery AJAX settings to use jsonp
// Add some helper methods into both Model and Collection to support "baseUrl"

Backbone.Model = Backbone.Model.extend({
    sync: function(method, model, options) {
//    options.timeout = 10000; // required, or the application won't pick up on 404 responses
        //options.dataType = 'jsonp';
        options.url = this.getBaseUrl() + this.url();
        return Backbone.sync(method, model, options);
    },
    getBaseUrl: function() {
        return this.get("baseUrl");
    },
    setBaseUrl: function(url) {
        this.set({baseUrl: url});
    },
    initialize: function(attributes, options) {
        if (options && options.baseUrl) {
            this.setBaseUrl(options.baseUrl);
        }
    }
});

Backbone.Collection = Backbone.Collection.extend({
    sync: function(method, model, options) {
        //options.dataType = 'jsonp';
        options.url = this.getBaseUrl() + this.url();
        return Backbone.sync(method, model, options);
    },
    // Did not find much information about how to store metadata with collection.
    // Direct set/get of property seems to work fine.
    getBaseUrl: function() {
        return this.baseUrl;
    },
    setBaseUrl: function(url) {
        this.baseUrl = url;
    },
    initialize: function(models, options) {
        if (options && options.baseUrl) {
            this.setBaseUrl(options.baseUrl);
        }
    }
});
