/************************************************************
■参考URL
	■the book of shaders
		https://thebookofshaders.com/
		
	■simplex noise sample code : GLSL tuned.
		https://github.com/ashima/webgl-noise
		
	■行列
		http://www3.nit.ac.jp/~hiroyasu/teaching/dendai/2013/im3-f/lect_im3-chap3.pdf
		
	■skew行列
		http://nakago.hatenablog.com/entry/2014/11/12/170800
		
■saved in "material" directory
	■Simplex noise demystified
		http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
		
	■Efficient Computational noise in GLSL
		saved in "material" directory.
************************************************************/
#pragma once

/************************************************************
************************************************************/
#include "ofMain.h"

/************************************************************
************************************************************/

class ofApp : public ofBaseApp{
private:
	/****************************************
	****************************************/
	enum{
		WIDTH = 600,
		HEIGHT = 600,
	};
	enum{
		BUF_SIZE = 1000,
	};
	
	enum{
		SIZE_PERM = 512,
	};
	
	/****************************************
	****************************************/
	ofShader shader_noise;
	ofShader shader_GlslTuned;
	ofShader *shader;
	
	int perm[SIZE_PERM];
	
	int NoiseDimension;
	bool b_UseTuned;
	
public:
	/****************************************
	****************************************/
	ofApp();
	~ofApp();

	void setup();
	void update();
	void draw();

	void keyPressed(int key);
	void keyReleased(int key);
	void mouseMoved(int x, int y );
	void mouseDragged(int x, int y, int button);
	void mousePressed(int x, int y, int button);
	void mouseReleased(int x, int y, int button);
	void mouseEntered(int x, int y);
	void mouseExited(int x, int y);
	void windowResized(int w, int h);
	void dragEvent(ofDragInfo dragInfo);
	void gotMessage(ofMessage msg);
	
};
