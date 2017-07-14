<?php

	chdir('src');

	$modules = array();
	$jsmodules = array();
	$filedata = file_get_contents('tg-all.js');

	ob_start();
	outputJS($filedata);
	$distributable = ob_get_contents();
	ob_end_clean();
		
	chdir('..');

	$distributable = file_get_contents('src/tg-require.js') . "\n" . $distributable;
	file_put_contents('dist/tg-all.js', $distributable);

	$minified = minify($distributable);
	file_put_contents('dist/tg-all-min.js', $minified);

	print "done.\n";

	function outputJS($data, $path = null) {
		$mainModPath = '';
		if (preg_match_all(
			"/\\brequire\(\s*['\"](.+)['\"]\s*\)\s*;?/",
			$data,
			$matches,
			PREG_SET_ORDER
		)) {
			if ($path == null) {
				$path = getcwd();
				$modpath = modpath($path);
				$mainModPath = "tgmodule.setpath('{$modpath}');\n";
			}
			for ($i = 0; $i < sizeof($matches); $i++) {
				$modname = $matches[$i][1];
				writeJSInclude($modname, $path);
			}
		}
		print $mainModPath . $data;
	}

	function writeJSInclude($modname, $path) {
		$fullpath = modpath("{$path}/{$modname}");
		$newpath = dirname($fullpath);
		if (!isset($jsmodules[$fullpath])) {
			$jsmodules[$fullpath] = true;
			if (!is_file($fullpath)) {
				// output nothing.
			} else if (preg_match("/\.(js|php)$/", $modname)) {
				$module = getJSScriptInclude($fullpath);
				outputJS($module, $newpath);
			} else {
				$module = getJSStringContent($fullpath);
				outputTxt($module);
			}
		}
	}

	function getJSScriptInclude($fullmodpath) {
		ob_start();
		$modpath = moddirname($fullmodpath);
		$modstart = "tgmodule.d('{$modpath}','{$fullmodpath}',function(module){\n";
		$modend = "});\n\n";
		$mod_rv = getModule($fullmodpath);
		$mod_output = ob_get_contents();
		if (is_object($mod_rv)) {
			$serializer = new \TG\APIIncludeSerializer();
			$mod_output = $serializer->serialize($mod_rv, $this);
		}
		$module = $modstart . $mod_output . $modend;
		ob_end_clean();
		return $module;
	}

	function getJSStringContent($fullname) {
		$modpath = moddirname($fullname);
		$modstart = "tgmodule.d('{$modpath}','{$fullname}',";
		$modend = ");\n\n";
		$data = file_get_contents($fullname);
		$module = $modstart
			. json_encode($data)
			. $modend
		;
		return $module;
	}

	function modpath($modname) {
		$root = getcwd();
		$pathCharsToIgnore = strlen($root);
		$fullmodpath = realpath($modname);
		return linuxify_path('.' . substr($fullmodpath, $pathCharsToIgnore));
	}

	function moddirname($modname) {
		$dir = dirname($modname);
		if ($dir == '.') {
			$dir = './';
		}
		return linuxify_path($dir);
	}

	function linuxify_path($path) {
		 return preg_replace("/\\\\/", "/", $path);
	}

	function getModule($src) {
		$realsrc = realpath('./' . $src);
		include_once($realsrc);	
		$module = @$modules[$realsrc];
		return $module;
	}

	function minify($data) {
		$postdata = http_build_query(
			array(
				'js_code' => $data,
				'compilation_level' => 'SIMPLE_OPTIMIZATIONS',
				'output_format' => 'text',
				'output_info' => 'compiled_code'
			)
		);

		$opts = array('http' =>
			array(
				'method'  => 'POST',
				'header'  => 'Content-type: application/x-www-form-urlencoded',
				'content' => $postdata
			)
		);

		$context  = stream_context_create($opts);
		$result = file_get_contents('http://closure-compiler.appspot.com/compile', false, $context);

		return $result;
	}

?>