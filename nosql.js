var NoSQL = function(){
	(function _contructor(simpledb, domainName){
		this.simpledb = simpledb;
		this.domainName = domainName;
	}).apply(this,arguments);
};

NoSQL.CREATE_IF_NOT_EXISTS = 1;

NoSQL.open = function(simpledb, dN, callback, option){
	var nosql = new NoSQL(simpledb, dN);
	simpledb.domainMetadata(dN,function(err, metadata){
		if(err && option === NoSQL.CREATE_IF_NOT_EXISTS) {
			simpledb.createDomain(dN,function(err, domain){
				callback(nosql);
			});
		}
		else {
			nosql.metadata = metadata;
			callback(nosql);
		}
	});
	return nosql;
};

NoSQL.prototype.put = function(itemName,attributes,callback){
	this.simpledb.putAttributes({
	    DomainName: this.domainName.DomainName,
	    ItemName: itemName,
	    Attributes: attributes
	},function(err,data){
		callback(err,data);
	});
};

NoSQL.prototype.get = function(itemName,callback){
	this.simpledb.getAttributes({
	    DomainName: this.domainName.DomainName,
	    ItemName: itemName
	},function(err,data){
		callback(err,data);
	});
};


module.exports = NoSQL;