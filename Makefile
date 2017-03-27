PNG = image/icon.png \
      image/icon-enable.png \
      image/icon-disable.png \

SRC = manifest.json \
      lib/webreload.js \
      page/background.js \
      page/background.html \

%.png: %.svg
	convert -background transparent -density 1200 -resize 48x48 $< $@

webreload-extension.zip: $(PNG) $(SRC)
	zip $@ $?

clean:
	rm -f image/*.png
	rm -f webreload-extension.zip
