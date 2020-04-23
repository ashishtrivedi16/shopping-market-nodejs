const fs = require('fs');

const deleteFIle = (filePath) => {
	fs.unlink(filePath, (err) => {
		if (err) {
			throw (err);
		}
	})
};

exports.deletFile = deleteFIle;