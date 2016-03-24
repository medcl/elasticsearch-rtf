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

var ClusterNodesListView = Backbone.View.extend({

    selectedClusterNodeView: undefined,

    events: {
        "click" : "nodeClicked"
    },

    initialize: function() {

        var _view = this;
        _view.clear();

        var nodes = _view.model.get("nodesState");
        if (nodes) {
            // First, try to bind to event if nodesState model is already there...
            _view.registerMasterNodeChangeHandler(nodes, _view);
        } else {
            // ... if the model is not available yet (because it is loaded via AJAX) then
            // wait for it to be loaded to bind to its events.
            this.model.on("change:nodesState",
                function(model){
                    var nodes = model.get("nodesState");
                    _view.registerMasterNodeChangeHandler(nodes, _view);
                });
        }
    },

    registerMasterNodeChangeHandler: function(nodes, view) {
        nodes.on("add", function(model){
          // We also want to be able to notice when existing node becomes a master or is
          // no longer a master. Thus every node gets a "master" attribute change listener.
          model.on("change:master", function(){
              view.updateMaster(model);
          });
          view.addNode(model);
        });

        nodes.on("remove", function(model){
          model.off(); // remove change:master listener
          view.removeNode(model);
        });

//        nodes.on("all", function(eventName){
//            console.log(eventName);
//        });
    },

    addNode: function(model) {
        var _view = this;
        var _class = "clusterNode";
        if (model.get("master")) {
            _class += " masterNode";
        }
        var div = _view.make("div", {
                "class": _class,
                "style": "display:none",
                "nodeId" : model.get("id")
            },
            model.get("name"));
        _view.$el.append(div);
        _view.$el.find("div").tsort();
        $(div).fadeIn("slow");
        return _view;
    },

    removeNode: function(model) {

        var _view = this;

        // if removing selected node, destroy detail view
        if (_view.selectedClusterNodeView != undefined) {
            if (_view.selectedClusterNodeView.nodeId() == model.id) {
                _view.selectedClusterNodeView.destroy();
            }
        }

        var toRemove = _view.$el.find("[nodeId=\""+model.id+"\"]");
        toRemove.removeClass("masterNode"); // looks better if master node goes away
        toRemove.fadeOut("slow", function(){toRemove.remove();});
        return _view;
    },

    updateMaster: function(model) {

        var _view = this;

        var nodeToUpdate = _view.$el.find("[nodeId=\""+model.id+"\"]");

        if (nodeToUpdate) {
            if (model.get("master")) {
                nodeToUpdate.addClass("masterNode");
            } else {
                nodeToUpdate.removeClass("masterNode");
            }
        }
    },

    setNodeAsSelected: function(nodeId) {

        var _view = this;

        _view.$el.find(".clusterNode").removeClass("selectedNode");

        var nodeToUpdate = _view.$el.find("[nodeId=\""+nodeId+"\"]");
        if (nodeToUpdate) {
            nodeToUpdate.addClass("selectedNode");
        }
    },

    render: function() {
        var _view = this;
        _view.clear();
        var nodes = _view.model.get("nodesState");
        if (nodes) {
            var iterator = function(node) { return node.get("name"); };
            var sorted = _.sortBy(nodes.models, iterator);
            var output = _.map(sorted, function(node){
                var _class = "clusterNode";
                if (node.get("master")) {
                    _class += " masterNode";
                }
                return _view.make("div", {
                        "class": _class,
                        "style": "display:none",
                        "nodeId" : node.get("id")
                    },
                    node.get("name"));
            });
            _.each(output, function(div){
                _view.$el.append(div);
                $(div).fadeIn("slow");
            });
        }
        return _view;
    },

    // clean list of nodes and destroy node detail view
    clear: function() {
        // TODO off all events from initialize()
        this.$el.empty();
        if (this.selectedClusterNodeView) {
            this.selectedClusterNodeView.destroy();
            this.selectedClusterNodeView = undefined;
        }
    },

    nodeClicked: function(event) {
        var _view = this;
        var target = event.target || event.srcElement;
        if (target && target.className) {
            if (target.className.indexOf("clusterNode") > -1) {

                var nodeId = $(target).attr("nodeId");
                _view.showNodeDetail(nodeId);

            }
        }
    },

    // if no node detail exists (no node is selected) then create a new view for selected node,
    // if some node is already selected and it differs from selected one, destroy view and create a new one
    // else ignore...
    showNodeDetail: function(nodeId) {

        var _view = this;
        var _model = _view.model;

        _view.setNodeAsSelected(nodeId);

        if (!this.selectedClusterNodeView) {
            this.selectedClusterNodeView = new SelectedClusterNodeView(
                {
                    nodeId: nodeId,
                    model: _model
                }
            );
            this.selectedClusterNodeView.render();
        }
        else if (this.selectedClusterNodeView.nodeId() != nodeId) {
            this.selectedClusterNodeView.destroy();
            this.selectedClusterNodeView = undefined;
            this.selectedClusterNodeView = new SelectedClusterNodeView(
                {
                    nodeId: nodeId,
                    model: _model
                }
            );
            this.selectedClusterNodeView.render();
        };

    }
});

