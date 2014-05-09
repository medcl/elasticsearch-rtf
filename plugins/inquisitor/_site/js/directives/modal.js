
app.directive('modalOpen', function() {
    return function(scope, element, attrs) {

        closeModal = function() {
            // backdrop could be null but shouldn't ever be undefined.
            if (typeof backdrop !== "undefined" && backdrop != null) {
                backdrop.unbind()
                backdrop.remove();
            }

            angular.element(body).unbind("keypress");
            modal.css("display", "none");

            body.removeClass('modal-open');
        };

        angular.element(element).bind("click", function() {
            // probably should have initialized these locally...
            modal = angular.element(document.getElementById(attrs.modalOpen)),
                body = angular.element(document).find("body");

            // add backdrop div even if there won't be a backdrop. probably not neccesary
            body.append('<div id="modal-backdrop"></div>');
            backdropAttr = attrs.hasOwnProperty("backdrop") ? attrs.backdrop : true;
            escapeAttr = attrs.hasOwnProperty("escapeExit") ? attrs.escapeExit : true;
            backdrop = angular.element(document.getElementById("modal-backdrop"));

            // typechecking boolean values but not string. not sure why.
            if (backdropAttr === true || backdropAttr == 'static') {
                backdrop.addClass("modal-backdrop");

                if (backdropAttr != 'static') {
                    // calling the callback within the bind breaks the backdrop (weird)
                    angular.element(backdrop).bind("click", function() {
                        closeModal();
                    });
                }
            }

            if (escapeAttr === true) {
                angular.element(body).bind("keypress", function(e) {
                    if (e.keyCode == 27) {
                        closeModal();
                    }
                });
            }

            body.addClass('modal-open');
            modal.css("display", "block");
        });
    }});

/*
 this is somewhat repetitive since we already have a closeModal() in the original
 directive. However, the only alternative is traversing the DOM looking for it. If
 angular implements a angular.element().trigger() function, that might be the way to go
 */
app.directive('modalClose', function() {
    return function(scope, element, attrs) {
        angular.element(element).bind("click", function() {
            var modal = document.getElementById(attrs.modalClose),
                backdrop = document.getElementById("modal-backdrop"),
                body = angular.element(document).find("body");

            angular.element(backdrop).unbind().remove();
            angular.element(body).unbind("keypress");
            angular.element(modal).css("display", "none");

            body.removeClass('modal-open');
        });
    }});