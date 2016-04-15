'use strict';

var libQ = require('kew');
var fs = require('fs-extra');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var config = new (require('v-conf'))();
var libUUID = require('node-uuid');
var S = require('string');
var self = this;

//Some functions of this plugin are taken from mw-white's Mount-utils  https://github.com/mw-white/node-linux-mountutils

// Define the ControllerNetworkfs class
module.exports = ControllerNetworkfs;

function ControllerNetworkfs(context) {
	var self = this;

	// Save a reference to the parent commandRouter
	self.context = context;
	self.commandRouter = self.context.coreCommand;
	self.logger = self.commandRouter.logger;

}

ControllerNetworkfs.prototype.getConfigurationFiles = function () {
	var self = this;

	return ['config.json'];
};

ControllerNetworkfs.prototype.onVolumioStart = function () {
	var self = this;

	var configFile = self.commandRouter.pluginManager.getConfigurationFile(self.context, 'config.json');
	config.loadFile(configFile);

	self.initShares();
};

ControllerNetworkfs.prototype.onStart = function () {
	var self = this;
	//Perform startup tasks here
};

ControllerNetworkfs.prototype.onStop = function () {
	var self = this;
	//Perform startup tasks here
};

ControllerNetworkfs.prototype.onRestart = function () {
	var self = this;
	//Perform startup tasks here
};

ControllerNetworkfs.prototype.onInstall = function () {
	var self = this;
	//Perform your installation tasks here
};

ControllerNetworkfs.prototype.onUninstall = function () {
	var self = this;
	//Perform your installation tasks here
};

ControllerNetworkfs.prototype.getUIConfig = function () {
	var self = this;

	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

	return uiconf;
};

ControllerNetworkfs.prototype.setUIConfig = function (data) {
	var self = this;

	var uiconf = fs.readJsonSync(__dirname + '/UIConfig.json');

};

ControllerNetworkfs.prototype.getConf = function (varName) {
	var self = this;

	return self.config.get(varName);
};

ControllerNetworkfs.prototype.setConf = function (varName, varValue) {
	var self = this;

	self.config.set(varName, varValue);
};

//Optional functions exposed for making development easier and more clear
ControllerNetworkfs.prototype.getSystemConf = function (pluginName, varName) {
	var self = this;
	//Perform your installation tasks here
};

ControllerNetworkfs.prototype.setSystemConf = function (pluginName, varName) {
	var self = this;
	//Perform your installation tasks here
};

ControllerNetworkfs.prototype.getAdditionalConf = function () {
	var self = this;
	//Perform your installation tasks here
};

ControllerNetworkfs.prototype.setAdditionalConf = function () {
	var self = this;
	//Perform your installation tasks here
};

ControllerNetworkfs.prototype.initShares = function () {
	var self = this;

	var keys = config.getKeys('NasMounts');
	for (var i in keys) {
		var key = keys[i];
		self.mountShare(key);
	}
};

ControllerNetworkfs.prototype.mountShare = function (shareid) {
	var self = this;

	var defer = libQ.defer();

	var sharename = config.get('NasMounts.' + shareid + '.name');
	var fstype = config.get('NasMounts.' + shareid + '.fstype');
	var options = config.get('NasMounts.' + shareid + '.options');
	var pointer;
	var fsopts;
	var credentials;

	if (fstype == "cifs") {
		pointer = '//' + config.get('NasMounts.' + shareid + '.ip') + '/' + config.get('NasMounts.' + shareid + '.path');
		//Password-protected mount
		if (config.get('NasMounts.' + shareid + '.user') !== 'undefined' && config.get('NasMounts.' + shareid + '.user') !== '') {
			credentials = 'username=' + config.get('NasMounts.' + shareid + '.user') + ',' + 'password=' + config.get('NasMounts.' + shareid + '.password') + ",";
		} else {
			credentials = 'guest,';
		}
		fsopts = credentials + "dir_mode=0777,file_mode=0666,iocharset=utf8,noauto";
		if (options !== 'undefined' && options !== '') {
			fsopts = fsopts + "," + options;
		}
	} else { // nfs
		pointer = config.get('NasMounts.' + shareid + '.ip') + ':' + config.get('NasMounts.' + shareid + '.path');
	}

	var mountpoint = '/mnt/NAS/' + config.get('NasMounts.' + shareid + '.name');

	mount(pointer, mountpoint, {"createDir": true, "fstype": fstype, "fsopts": fsopts}, function (result) {

		if (result.error) {
			var splitted = result.error.split(':');
			var error = splitted.slice(-1)[0];
			console.log('ERRRRRRRRRRRR------------------------------' + error );
			// Something went wrong!
			defer.reject(new Error('Cannot mount share'  + sharename + ':  ' + error));
			self.context.coreCommand.pushConsoleMessage('[' + Date.now() + '] Error Mounting Share ' + sharename + ': ' + error);
			self.context.coreCommand.pushToastMessage('alert', "Music Library", 'Error adding Network Share: ' + error);
		} else {
			console.log('----------------------------------------------NO ERROR');
			self.context.coreCommand.pushConsoleMessage('[' + Date.now() + ']' + sharename + ' Share Mounted Successfully');
			self.context.coreCommand.pushToastMessage('success', "Music Library", 'Network Share Successfully added ');
			defer.resolve({});
		}
	});

	return defer.promise;
};

ControllerNetworkfs.prototype.getConfigurationFiles = function () {
	var self = this;

	return ['config.json'];
};

ControllerNetworkfs.prototype.saveShare = function (data) {
	var self = this;

	var defer = libQ.defer();

	var name = data['Flac.name'];
	var nameStr = S(name);

	/**
	 * Check special characters
	 */
	if (nameStr.contains('/')) {
		self.commandRouter.pushToastMessage('warning', "Shares", 'Share names cannot contain /');
		defer.reject(new Error('Share names cannot contain /'));
		return;
	}

	var ip = data['Flac.ip'];
	var fstype = data['Flac.fstype'].value;
	var username = data['Flac.username'];
	var password = data['Flac.password'];
	var options = data['Flac.options'];

	if (username == undefined) username = '';
	if (password == undefined) password = '';
	if (options == undefined) options = '';

	config.addConfigValue('NasMounts.Flac.name', 'string', name);
	config.addConfigValue('NasMounts.Flac.path', 'string', path);
	config.addConfigValue('NasMounts.Flac.ip', 'string', ip);
	config.addConfigValue('NasMounts.Flac.fstype', 'string', fstype);
	config.addConfigValue('NasMounts.Flac.user', 'string', username);
	config.addConfigValue('NasMounts.Flac.password', 'string', password);
	config.addConfigValue('NasMounts.Flac.options', 'string', options);

	self.initShares();

	self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration has been successfully updated');
	setTimeout(function () {
		self.scanDatabase();
		//Wait for share to be mounted before scanning
	}, 3000)
	defer.resolve({});
	return defer.promise;
};


ControllerNetworkfs.prototype.getShare = function (name, ip, path) {
	var self = this;

	var keys = config.getKeys('NasMounts');
	for (var i in keys) {
		var subKey = 'NasMounts.' + keys[i];
		self.logger.info("Checking key " + subKey);

		if (config.get(subKey + '.name') == name &&
			config.get(subKey + '.ip') == ip && config.get(subKey + '.path') == path) {
			self.logger.info("Found correspondence in configuration");
			return keys[i];
		}

	}
};


ControllerNetworkfs.prototype.scanDatabase = function () {
	var self = this;

	exec("/usr/bin/mpc update", function (error, stdout, stderr) {
		if (error !== null) {
			self.commandRouter.pushToastMessage('warning', "My Music", 'Error scanning Database: ' + error);
			self.context.coreCommand.pushConsoleMessage('[' + Date.now() + '] Database scan error: ' + error);
		}
		else {
			self.context.coreCommand.pushConsoleMessage('[' + Date.now() + '] Database update started');
			self.commandRouter.pushToastMessage('success', "My Music", 'Music Database Update in Progress');
		}
	});
};

ControllerNetworkfs.prototype.listShares = function () {
	var mounts = config.getKeys();


};


/*
 New APIs
 ###############################
 */

/**
 * This method adds a new share into the configuration
 * @param data {
  name:’SHARE’,
  ip:’192.168.10.1’,
  fstype:’’,
  username:’’,
  password:’’,
  options:’’
}

 */
ControllerNetworkfs.prototype.addShare = function (data) {
	var self = this;

	self.logger.info("Adding a new share");

	var defer = libQ.defer();

	var name = data['name'];
	var nameStr = S(name);

	/**
	 * Check special characters
	 */
	if (nameStr.contains('/')) {
		self.commandRouter.pushToastMessage('warning', "Shares", 'Share names cannot contain /');
		defer.reject(new Error('Share names cannot contain /'));
		return defer.promise;
	}

	var ip = data['ip'];
	var path = data['path'];
	var fstype = data['fstype'];
	var username = data['username'];
	var password = data['password'];
	var options = data['options'];

	if (username == undefined) username = '';
	if (password == undefined) password = '';
	if (options == undefined) options = '';

	var uuid = self.getShare(name, ip, path);
	var response;
	if (uuid == undefined) {
		self.logger.info("No correspondence found in configuration for share " + name + " on IP " + ip);
		uuid = libUUID.v4();
		var key = "NasMounts." + uuid + ".";
		config.addConfigValue(key + 'name', 'string', name);
		config.addConfigValue(key + 'ip', 'string', ip);
		config.addConfigValue(key + 'path', 'string', path);
		config.addConfigValue(key + 'fstype', 'string', fstype);
		config.addConfigValue(key + 'user', 'string', username);
		config.addConfigValue(key + 'password', 'string', password);
		config.addConfigValue(key + 'options', 'string', options);

		setTimeout(function () {
			try {
				self.initShares();

				response = {
					success: true,
					uuid: uuid
				};

				setTimeout(function () {
					self.commandRouter.pushToastMessage('success', "Configuration update", 'The configuration has been successfully updated');
					self.scanDatabase();
				}, 3000);
				defer.resolve(response);
			}
			catch (err) {
				defer.resolve({
					success: false,
					reason: 'An error occurred mounting your share'
				});
			}


		}, 500);
	}
	else {
		defer.resolve({
			success: false,
			reason: 'This share has already been configured'
		});
	}

	return defer.promise;
};

ControllerNetworkfs.prototype.deleteShare = function (data) {
	var self = this;

	var defer = libQ.defer();
	var key = "NasMounts." + data['id'];

	var response;

	if (config.has(key)) {
		var mountpoint = '/mnt/NAS/' + config.get(key + '.name');

		setTimeout(function () {
			try {
				exec('/usr/bin/sudo /bin/umount -l ' + mountpoint + ' ', {
					uid: 1000,
					gid: 1000
				}, function (error, stdout, stderr) {
					if (error !== null) {
						self.commandRouter.pushToastMessage('alert', "Configuration update", 'The share cannot be deleted: ' + error);
						self.logger.error("Mount point cannot be removed, won't appear next boot. Error: " + error);
					}
					else {
						exec('rm -rf ' + mountpoint + ' ', {uid: 1000, gid: 1000}, function (error, stdout, stderr) {
							if (error !== null) {
								self.commandRouter.pushToastMessage('alert', "Configuration update", 'The folder cannot be deleted: ' + error);
								self.logger.error("Cannot Delete Folder. Error: " + error);
							}
							else {

								self.commandRouter.pushToastMessage('success', "Configuration update", 'The share has been deleted');
							}
						});
					}
				});


				setTimeout(function () {

					self.scanDatabase();
				}, 3000);
				defer.resolve({success: true});
			}
			catch (err) {
				defer.resolve({
					success: false,
					reason: 'An error occurred deleting your share'
				});
			}


		}, 500);

		config.delete(key);
	}
	else {
		defer.resolve({
			success: false,
			reason: 'This share is not configured'
		});
	}

	return defer.promise;
};


ControllerNetworkfs.prototype.listShares = function (data) {
	var self = this;

	var response = [];
	var size = '';
	var unity = '';
	var defer = libQ.defer();

	var shares = config.getKeys('NasMounts');
	var nShares = shares.length;

	if (nShares > 0) {
		response = [];

		var promises = [];

		for (var i = 0; i < nShares; i++) {
			promises.push(this.getMountSize(shares[i]));
		}
		libQ.all(promises).then(function (d) {
			defer.resolve(d);
		}).fail(function (e) {
			console.log("Failed getting mounts size", e)
		});
	}
	else {
		response = [];
		defer.resolve(response);

	}
	return defer.promise;
};

ControllerNetworkfs.prototype.getMountSize = function (share) {
	var self = this;
	return new Promise(function (resolve, reject) {
		var realsize = '';
		var key = 'NasMounts.' + share + '.';
		var name = config.get(key + 'name');
		var mountpoint = '/mnt/NAS/' + name;
		var mounted = self.isMounted(mountpoint, false);
		var respShare = {
			path: config.get(key + 'path'),
			ip: config.get(key + 'ip'),
			id: share,
			name: name,
			fstype: config.get(key + 'fstype'),
			mounted: mounted.mounted,
			size: realsize
		};
		var cmd="df -BM "+mountpoint+" | awk '{print $3}'";
		var promise = libQ.ncall(exec,respShare,cmd).then(function (stdout){


			var splitted=stdout.split('\n');
			var sizeStr=splitted[1];

			var size=parseInt(sizeStr.substring(0,sizeStr.length-1));

			var unity = 'MB';
			if (size > 1024) {
				size = size / 1024;
				unity = 'GB';
				if (size > 1024) {
					size = size / 1024;
					unity = 'TB';
				}
			}
			realsize = size.toFixed(2);
			respShare.size = realsize + " " + unity ;
			resolve(respShare);

		}).fail(function (e){
			console.log("fail...." + e);
			reject(respShare);
		});
	});
};

/**
 * {
 name:’SHARE su 192.168.10.135’
  path:’SHARE’,
  id:’dsdsd’,
  ip:’192.168.10.1’,
  fstype:’’,
  username:’’,
  password:’’,
  options:’’
}

 * @param data
 * @returns {*}
 */
ControllerNetworkfs.prototype.infoShare = function (data) {
	var self = this;

	var defer = libQ.defer();

	if (config.has('NasMounts.' + data['id'])) {
		var key = 'NasMounts.' + data['id'] + '.';
		var response = {
			path: config.get(key + 'path'),
			name: config.get(key + 'name'),
			id: data['id'],
			ip: config.get(key + 'ip'),
			fstype: config.get(key + 'fstype'),
			username: config.get(key + 'user'),
			password: config.get(key + 'password'),
			options: config.get(key + 'options')
		};

		defer.resolve(response);
	}
	else defer.resolve({});

	return defer.promise;
};

/**
 * {
  id:’fdfdvoeo’,
  name:’SHARE’,
  ip:’192.168.10.1’,
  fstype:’’,
  username:’’,
  password:’’,
  options:’’
}

 * @param data
 * @returns {*}
 */
ControllerNetworkfs.prototype.editShare = function (data) {
	var self = this;

	var defer = libQ.defer();

	if (config.has('NasMounts.' + data['id'])) {
		var mountpoint = '/mnt/NAS/' + config.get('NasMounts.' + data['id'] + '.name');
		umount(mountpoint, false, {"removeDir": true}, function (result) {
			if (result.error) {
				defer.resolve({
					success: false,
					reason: 'Cannot unmount share'
				});
			} else {
				self.logger.info("Share " + config.get('NasMounts.' + data['id'] + '.name') + " successfully unmounted");
				var key = 'NasMounts.' + data['id'] + '.';

				var oldpath = config.get(key + 'path');
				var oldname = config.get(key + 'name');
				var oldip = config.get(key + 'ip');
				var oldfstype = config.get(key + 'fstype');
				var oldusername = config.get(key + 'user');
				var oldpassword = config.get(key + 'password');
				var oldoptions = config.get(key + 'options');

				config.set(key + 'name', data['name']);
				config.set(key + 'path', data['path']);
				config.set(key + 'ip', data['ip']);
				config.set(key + 'fstype', data['fstype']);
				config.set(key + 'user', data['username']);
				config.set(key + 'password', data['password']);
				config.set(key + 'options', data['options']);

				var mountDefer = self.mountShare(data['id']);
				mountDefer.then(function (value) {
						self.logger.info("New share mounted");
						defer.resolve({
							success: true,
							reason: 'Cannot unmount share'
						});
					})
					.fail(function () {

						self.logger.info("An error occurred mounting the new share. Rolling back configuration");
						config.set(key + 'name', oldname);
						config.set(key + 'path', oldpath);
						config.set(key + 'ip', oldip);
						config.set(key + 'fstype', oldfstype);
						config.set(key + 'user', oldusername);
						config.set(key + 'password', oldpassword);
						config.set(key + 'options', oldoptions);

						defer.resolve({
							success: true,
							reason: 'Cannot unmount share'
						});
					});


			}
		});

	}
	else defer.resolve({
		success: false,
		reason: 'Share not found'
	});

	return defer.promise;
};


// Mount-utils

var isMounted = function(path, isDevice) {
	// Sanity checks - if we're looking for a filesystem path that doesn't
	// exist, it's probably not mounted...
	if (!isDevice && !fs.existsSync(path)) {
		return({"mounted": false, "error": "Path does not exist"});
	}
	// Need mtab to check existing mounts
	if (!fs.existsSync("/etc/mtab")) {
		return({"mounted": false, "error": "Can't read mtab"});
	}

	var mtab = fs.readFileSync("/etc/mtab", { 'encoding': 'ascii' }).split("\n");
	// Interate through and find the one we're looking for
	for (var i in mtab) {
		var mountDetail = mtab[i].split(" ");
		// Does the appropriate field match?  Exact match only.
		if ((isDevice && (mountDetail[0]==path)) || (!isDevice && (mountDetail[1]==path))) {
			return({
				"mounted": true,
				"device": mountDetail[0],
				"mountpoint": mountDetail[1],
				"fstype": mountDetail[2],
				"fsopts": mountDetail[3]
			});
		}
	}
	// Didn't find it
	return({"mounted":false});
}

var mount = function(dev, path, options, callback) {
	// See if there is already something mounted at the path
	var mountInfo = isMounted(path,false);
	if (mountInfo.mounted) {
		callback({"error": "Something is already mounted on " + path});
		return;
	}

	// See if the mountpoint exists.  If not, do we create?
	if (!fs.existsSync(path)) {
		if (options.createDir) {
			var mode = "0777";
			if (options.dirMode) {
				mode = options.dirMode;
			}
			fs.mkdirSync(path,mode);
		} else {
			callback({"error": "Mount directory does not exist"});
			return;
		}
	}
	// Make sure mountpoint is a directory
	if (!fs.statSync(path).isDirectory()) {
		callback({"error": "Mountpoint is not a directory"});
		return;
	}

	// Build the command line
	var cmd = (options.noSudo?"":
		(options.sudoPath?options.sudoPath:"/usr/bin/sudo")+" ") +
		(options.mountPath?options.mountPath:"/bin/mount") + " " +
		(options.readonly?"-r ":"") +
		(options.fstype?"-t " + options.fstype + " ":"") +
		(options.fsopts?"-o " + options.fsopts + " ":"") +
		dev + " " + path;

	// Let's do it!
	var mountProc = try {
		execSync(cmd, function(error, stdout, stderr) {
		if (error !== null) {
			callback({ "error": "exec error " + error });
		} else {
			callback({ "OK": true });
		}
		}
	} catch(e) {
		console.log(e);
	} //readFileSync will fail until file exists
	});
}

var umount = function(path, isDevice, options, callback) {
	// See if it's mounted
	var mountInfo = this.isMounted(path,isDevice);
	if (!mountInfo.mounted) {
		callback({"OK": true});
		return;
	}

	// Build the command line
	var cmd = (options.noSudo?"":
		(options.sudoPath?options.sudoPath:"/usr/bin/sudo")+" ") +
		(options.umountPath?options.umountPath:"/bin/umount") + " " + path;

	// Let's do it!
	var umountProc = exec(cmd, function(error, stdout, stderr) {
		if (error !== null) {
			callback({ "error": "exec error " + error });
		} else {
			// Remove the mountpoint if the option was given
			if (options.removeDir) {
				fs.rmdirSync(mountInfo.mountpoint);
			}
			callback({ "OK": true });
		}
	});
}

//var ethspeed = execSync("/usr/bin/sudo /sbin/ethtool eth0 | grep -i speed | tr -d 'Speed:' | xargs", { encoding: 'utf8' });