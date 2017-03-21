webreload-extension.zip: manifest.json lib/webreload.js
	zip $@ $?

clean:
	rm -f webreload-extension.zip
