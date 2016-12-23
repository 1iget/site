
// var Foo = new BaseModel('foo');
var model = function(className, onSuccess, onError) {
    this.handlers = {
        success: function(model) {
            // incase the model was updated due
            // to parse calls
            this.instance = model;
            onSuccess.call(this, model);
        },
        error: function(model, error) {
            onError.call(this, model, error);
        }
    };
    this.Model = Parse.Object.extend("GameScore");
    this.className = className;
};

// var fooRecord = Foo.new({bar:'bar'});
model.prototype.new = function(values) {
    this.instance = new this.Model();
    model.save(values, this.handlers);
    return this;
};

// fooRecord.save(values) or fooRecord.instance.bar = 'foo'; fooRecord.save();
model.prototype.save = function(values) {
    model.save(values, this.handlers);
    return this;
};

// fooRecord.destroy() or fooRecord.destroy(id);
model.prototype.destroy = function(id) {
    var query = new Parse.Query(this.Model);
    // remove a passed in id, or remove this instance
    id = id || this.instance.id;
    query.equalTo("objectId", id);
    query.first(this.handlers);
    return this;
};

// fooRecord.getById(id).destroy() or fooRecord.getById(id).save({bar:'foo'});
model.prototype.getById= function(id, cb, cberror){
    var query = new Parse.Query(this.Model);
    query.equalTo("objectId", id);
    query.find(this.handlers);
    return this;
};

// export base model
module.exports = model;