@echo off
xcopy D:\helium\digime-sdk-js\dist D:\helium\web-testing-suite\node_modules\@digime\digime-js-sdk\dist /s /e
xcopy D:\helium\digime-sdk-js\src D:\helium\web-testing-suite\node_modules\@digime\digime-js-sdk\src /s /e
pause