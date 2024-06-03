@ECHO OFF
SET wcModulesDir1=C:\Users\owenl\activeProjects\wifiCUE\node_modules\ytsr
SET wcModulesDir2=C:\Users\owenl\activeProjects\wifiCUE\app\node_modules\ytsr
SET fixedYTSRDir=C:\Users\owenl\activeProjects\wifiCUE\fixYTSR
robocopy %fixedYTSRDir% %wcModulesDir1% /COPYALL /E
robocopy %fixedYTSRDir% %wcModulesDir2% /COPYALL /E
@ECHO ON
