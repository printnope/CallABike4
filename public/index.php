<?php


$initializePath ='../data/initialize.php';
$createJsonPath = '../data/createJson.php';
$pathToJsonFile = '../data/stations.json';
$isInitialize = false;


if ($isInitialize) {
    // Zeitmessung für initialize.php
    $initStartTime = microtime(true);

    include($initializePath);

    $initEndTime = microtime(true);
    $initDuration = $initEndTime - $initStartTime;
    echo "initialize.php hat geklappt in " . number_format($initDuration, 4) . " Sekunden.<br>";
}


if (!file_exists($pathToJsonFile) || (time() - filemtime($pathToJsonFile)) > 36000000000) {
    // Zeitmessung für createJson.php
    $jsonStartTime = microtime(true);

    include($createJsonPath);

    $jsonEndTime = microtime(true);
    $jsonDuration = $jsonEndTime - $jsonStartTime;
    echo "createJson.php wurde ausgeführt in " . number_format($jsonDuration, 4) . " Sekunden.<br>";
} else{
    echo "createJson.php existiert bereits.<br>";
}

//header("Location: map.php");
//exit();

?>
