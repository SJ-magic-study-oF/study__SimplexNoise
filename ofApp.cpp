/************************************************************
************************************************************/
#include "ofApp.h"


/************************************************************
************************************************************/
// A lookup table to traverse the simplex around a given point in 4D.
// Details can be found where this table is used, in the 4D noise method.
static int simplex[][4] = {
	{0,1,2,3},{0,1,3,2},{0,0,0,0},{0,2,3,1},{0,0,0,0},{0,0,0,0},{0,0,0,0},{1,2,3,0},
	{0,2,1,3},{0,0,0,0},{0,3,1,2},{0,3,2,1},{0,0,0,0},{0,0,0,0},{0,0,0,0},{1,3,2,0},
	{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},
	{1,2,0,3},{0,0,0,0},{1,3,0,2},{0,0,0,0},{0,0,0,0},{0,0,0,0},{2,3,0,1},{2,3,1,0},
	{1,0,2,3},{1,0,3,2},{0,0,0,0},{0,0,0,0},{0,0,0,0},{2,0,3,1},{0,0,0,0},{2,1,3,0},
	{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},{0,0,0,0},
	{2,0,1,3},{0,0,0,0},{0,0,0,0},{0,0,0,0},{3,0,1,2},{3,0,2,1},{0,0,0,0},{3,1,2,0},
	{2,1,0,3},{0,0,0,0},{0,0,0,0},{0,0,0,0},{3,1,0,2},{0,0,0,0},{3,2,0,1},{3,2,1,0}
};

static int p[] = {
	151,160,137,91,90,15,
	131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
	190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
	88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
	77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
	102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
	135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
	5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
	223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
	129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
	251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
	49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
	138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
};

static float grad3[][3] = {
	{1,1,0},	{-1,1,0},	{1,-1,0},	{-1,-1,0},
	{1,0,1},	{-1,0,1},	{1,0,-1},	{-1,0,-1},
	{0,1,1},	{0,-1,1},	{0,1,-1},	{0,-1,-1}
};
 
static float grad4[][4] = {
	{0,1,1,1},	{0,1,1,-1},		{0,1,-1,1},		{0,1,-1,-1},
	{0,-1,1,1},	{0,-1,1,-1},	{0,-1,-1,1},	{0,-1,-1,-1},
	{1,0,1,1},	{1,0,1,-1},		{1,0,-1,1},		{1,0,-1,-1},
	{-1,0,1,1},	{-1,0,1,-1},	{-1,0,-1,1},	{-1,0,-1,-1},
	{1,1,0,1},	{1,1,0,-1},		{1,-1,0,1},		{1,-1,0,-1},
	{-1,1,0,1},	{-1,1,0,-1},	{-1,-1,0,1},	{-1,-1,0,-1},
	{1,1,1,0},	{1,1,-1,0},		{1,-1,1,0},		{1,-1,-1,0},
	{-1,1,1,0},	{-1,1,-1,0},	{-1,-1,1,0},	{-1,-1,-1,0}
};

/************************************************************
************************************************************/

/******************************
******************************/
ofApp::ofApp()
: b_UseTuned(false)
, NoiseDimension(2)
{
}

/******************************
******************************/
ofApp::~ofApp()
{
}

//--------------------------------------------------------------
void ofApp::setup(){
	/********************
	********************/
	ofSetWindowTitle("perlin noise");
	
	ofSetWindowShape(WIDTH, HEIGHT);
	ofSetEscapeQuitsApp(false);
	
	ofEnableAlphaBlending();
	ofEnableBlendMode(OF_BLENDMODE_ALPHA);
	// ofEnableBlendMode(OF_BLENDMODE_ADD);
	// ofEnableSmoothing();
	
	/********************
	********************/
	shader_noise.load( "noise.vert", "noise.frag" );
	shader_GlslTuned.load( "GLSL_Tuned.vert", "GLSL_Tuned.frag" );
	
	for(int i = 0; i < SIZE_PERM; i++) perm[i] = p[i & 255];
}

//--------------------------------------------------------------
void ofApp::update(){

}

//--------------------------------------------------------------
void ofApp::draw(){
	/********************
	********************/
	if(b_UseTuned)	shader = &shader_GlslTuned;
	else			shader = &shader_noise;
	
	/********************
	********************/
	ofBackground(0);
	
	/********************
	********************/
	shader->begin();
	
		/* */
		shader->setUniform2f( "u_resolution", ofGetWidth(), ofGetHeight() );
		shader->setUniform2f( "u_mouse", mouseX, mouseY );
		shader->setUniform1f( "u_time", ofGetElapsedTimef() );
		shader->setUniform1i( "NoiseDimension", NoiseDimension );
		
		/********************
		tips on sending array to shader with oF 0.9.0(temporary countermeasure)
			https://github.com/SJ-magic-study-oF/study__shader_sendingArray
		********************/
		GLuint program = shader->getProgram();
		glUseProgram(program);
		
		GLint loc = glGetUniformLocation(program, "simplex");
		glUniform4iv(loc, sizeof(simplex)/sizeof(simplex[0]), &simplex[0][0]);
		
		loc = glGetUniformLocation(program, "perm");
		glUniform1iv(loc, SIZE_PERM, perm);
		
		loc = glGetUniformLocation(program, "grad3");
		glUniform3fv(loc, sizeof(grad3)/sizeof(grad3[0]), &grad3[0][0]);
		
		loc = glGetUniformLocation(program, "grad4");
		glUniform4fv(loc, sizeof(grad4)/sizeof(grad4[0]), &grad4[0][0]);
			
		/* */
		ofSetColor( 255, 255, 255 );
		ofFill();
		ofDrawRectangle(0, 0, ofGetWidth(), ofGetHeight());
	
	shader->end();

	/********************
	********************/
	ofSetColor(255, 0, 0, 255);
	
	char buf[BUF_SIZE];
	if(b_UseTuned)	{ sprintf(buf, "%-15s\nDimension = %d", "GLSL_tuned", NoiseDimension); }
	else			{ sprintf(buf, "%-15s\nDimension = %d", "Reference_Array", NoiseDimension); }
	
	ofDrawBitmapString(buf, 20, 20);
}

//--------------------------------------------------------------
void ofApp::keyPressed(int key){
	switch(key){
		case '2':
		case '3':
		case '4':
			NoiseDimension = key - '0';
			
			printf("NoiseDimension = %d\n", NoiseDimension);
			fflush(stdout);
			break;
			
		case ' ':
			b_UseTuned = !b_UseTuned;
			printf("b_UseTuned = %d\n", b_UseTuned);
			fflush(stdout);
			break;
			
		case 's':
			ofSaveScreen("image.png");
			printf("image saved\n");
 			break;
	}
}

//--------------------------------------------------------------
void ofApp::keyReleased(int key){

}

//--------------------------------------------------------------
void ofApp::mouseMoved(int x, int y ){

}

//--------------------------------------------------------------
void ofApp::mouseDragged(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mousePressed(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mouseReleased(int x, int y, int button){

}

//--------------------------------------------------------------
void ofApp::mouseEntered(int x, int y){

}

//--------------------------------------------------------------
void ofApp::mouseExited(int x, int y){

}

//--------------------------------------------------------------
void ofApp::windowResized(int w, int h){

}

//--------------------------------------------------------------
void ofApp::gotMessage(ofMessage msg){

}

//--------------------------------------------------------------
void ofApp::dragEvent(ofDragInfo dragInfo){ 

}
