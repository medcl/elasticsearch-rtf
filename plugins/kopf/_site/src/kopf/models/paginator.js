function Paginator(page, page_size, collection, filter) {

    this.filter = filter;

    this.page = page;

    this.page_size = page_size;

    this.$collection = isDefined(collection) ? collection : [];

    this.nextPage=function() {
        this.page += 1;
    };

    this.previousPage=function() {
        this.page -= 1;
    };

    this.getPage=function() {
        var results = this.getResults();
        var total = results.length;

        var first = total > 0 ? ((this.page - 1) * this.page_size) + 1 : 0;
        while (total < first) {
            this.previousPage();
            first = (this.page - 1) * this.page_size + 1;
        }
        var last = this.page * this.page_size > total ? total : this.page * this.page_size;

        var elements = total > 0 ? results.slice(first - 1, last) : [];

        var next = this.page_size * this.page < total;
        var previous = this.page > 1;
        while (elements.length < this.page_size) {
            elements.push(null);
        }
        return new Page(elements, total, first, last, next, previous);
    };

    this.setCollection=function(collection) {
        this.$collection = collection;
    };

    this.getResults=function() {
        var filter = this.filter;
        var collection = this.$collection;
        if (filter.isBlank()) {
            return collection;
        } else {
            var filtered_collection = [];
            collection.forEach(function(item) {
                if (filter.matches(item)) {
                    filtered_collection.push(item);
                }
            });
            return filtered_collection;
        }
    };


    this.getCollection=function() {
        return this.$collection;
    };

}

function Page(elements, total, first, last, next, previous) {
    this.elements = elements;
    this.total = total;
    this.first = first;
    this.last = last;
    this.next = next;
    this.previous = previous;
}