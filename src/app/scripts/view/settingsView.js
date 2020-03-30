const Path = require(__dirname + '/../storage/paths.js');
const View = require(__dirname + '/view.js');

/**
 * Class for controling the settings page of the application.
 */
module.exports = class SettingsView extends View {
	constructor(storage) {
		super(storage);
	}

	/**
	 * Updates the view.
	 */
	updateView() {
		this.updatePreferences();
	}

	updatePreferences() {

	}

	/**
	 * Updates the path to the user data directory. In case the path changes,
	 * it moves all files from the old directory to the new location.
	 */
	updateFilepath() {
		let {dialog} = require('electron').remote;

		let oldPath = this.storage.readPreference('path');
		let newPath = dialog.showOpenDialog({properties: ['openDirectory']});
		if (newPath && newPath[0] !== oldPath) {
			Path.moveFiles(oldPath, newPath[0]);
			this.storage.storePreference('path', newPath[0]);
			
			this.updatePreferences();
		}
	}

	/**
	 * Switches between fullscreen and window mode.
	 * 
	 * @param {bool} fullscreen Indicates whether the app should be in fullscreen mode.
	 */
	toggleWindowMode(fullscreen) {
		require('electron').remote.getCurrentWindow().setFullScreen(fullscreen);
		this.storage.storePreference('fullscreen', fullscreen);
	}
}