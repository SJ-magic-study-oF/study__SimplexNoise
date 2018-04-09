/************************************************************


************************************************************/
#version 120
#extension GL_ARB_texture_rectangle : enable
#extension GL_EXT_gpu_shader4 : enable

/************************************************************
************************************************************/
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

uniform int NoiseDimension = 2;

// A lookup table to traverse the simplex around a given point in 4D.
// Details can be found where this table is used, in the 4D noise method.
uniform ivec4 simplex[64];

uniform int perm[512]; // permutation table
uniform vec3 grad3[12];
uniform vec4 grad4[32];
 
 
/************************************************************
************************************************************/
float snoise(vec2 v);
float snoise(vec3 v);
float snoise(vec4 v);


/************************************************************
************************************************************/

/******************************
******************************/
void main() {
	/********************
	********************/
	vec2 st = gl_FragCoord.xy/u_resolution.xy;
	st.x *= u_resolution.x/u_resolution.y;
	
	vec2 MousePos = u_mouse.xy / u_resolution.xy;
	MousePos.x *= u_resolution.x/u_resolution.y;
	
	st *= 5;
	vec2 SeedOfNoise_2D = st;
	vec3 SeedOfNoise_3D = vec3(st, u_time * 0.5);
	vec4 SeedOfNoise_4D = vec4(st, MousePos);

	
	/********************
	********************/
	float noise;
	if(NoiseDimension == 4)			noise = snoise(SeedOfNoise_4D);
	else if(NoiseDimension == 3)	noise = snoise(SeedOfNoise_3D);
	else							noise = snoise(SeedOfNoise_2D);
	
	noise = noise * 0.5 + 0.5;
	
	/********************
	********************/
	vec3 color = vec3(0.0);
	color = vec3(noise);
	gl_FragColor = vec4(color, 1.0);
}

/******************************
******************************/
float snoise(vec2 v){
	float n0, n1, n2; // Noise contributions from the three corners
	
	float F2 = 0.5*(sqrt(3.0)-1.0);
	float s = (v.x+v.y)*F2;
	int i = int(floor(v.x+s));
	int j = int(floor(v.y+s));
	
	float G2 = (3.0-sqrt(3.0))/6.0;
	float t = (i+j)*G2;
	float X0 = i-t; // Unskew the cell origin back to (x,y) space
	float Y0 = j-t;
	float x0 = v.x-X0; // The x,y distances from the cell origin
	float y0 = v.y-Y0;
	
	int i1, j1;
	if(x0>y0)	{i1=1; j1=0;}
	else		{i1=0; j1=1;}
	
	float x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
	float y1 = y0 - j1 + G2;
	float x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
	float y2 = y0 - 1.0 + 2.0 * G2;
	
	int ii = i & 255;
	int jj = j & 255;
	int gi0 = perm[ii+perm[jj]] % 12;
	int gi1 = perm[ii+i1+perm[jj+j1]] % 12;
	int gi2 = perm[ii+1+perm[jj+1]] % 12;
	
	float t0 = 0.5 - x0*x0-y0*y0;
	if(t0<0){
		n0 = 0.0;
	}else{
		t0 *= t0;
		n0 = t0 * t0 * dot(vec2(grad3[gi0].x, grad3[gi0].y), vec2(x0, y0));
	}
	
	float t1 = 0.5 - x1*x1-y1*y1;
	if(t1<0){
		n1 = 0.0;
	}else{
		t1 *= t1;
		n1 = t1 * t1 * dot(vec2(grad3[gi1].x, grad3[gi1].y), vec2(x1, y1));
	}
	
	float t2 = 0.5 - x2*x2-y2*y2;
	if(t2<0){
		n2 = 0.0;
	}else{
		t2 *= t2;
		n2 = t2 * t2 * dot(vec2(grad3[gi2].x, grad3[gi2].y), vec2(x2, y2));
	}
	
	return 70.0 * (n0 + n1 + n2);
}


/******************************
******************************/
float snoise(vec3 v){
	float n0, n1, n2, n3;
	
	float F3 = 1.0/3.0;
	float s = (v.x+v.y+v.z)*F3;
	int i = int(floor(v.x+s));
	int j = int(floor(v.y+s));
	int k = int(floor(v.z+s));
	
	float G3 = 1.0/6.0;
	float t = (i+j+k)*G3;
	float X0 = i-t;
	float Y0 = j-t;
	float Z0 = k-t;
	float x0 = v.x-X0;
	float y0 = v.y-Y0;
	float z0 = v.z-Z0;
	
	int i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
	int i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
	if(x0>=y0){
		if(y0>=z0)		{ i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; } // X Y Z order
		else if(x0>=z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; } // X Z Y order
		else			{ i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; } // Z X Y order
	}else { // x0<y0
		if(y0<z0)		{ i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; } // Z Y X order
		else if(x0<z0)	{ i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; } // Y Z X order
		else			{ i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; } // Y X Z order
	}
	
	// A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
	// a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
	// a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
	// c = 1/6.
	float x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
	float y1 = y0 - j1 + G3;
	float z1 = z0 - k1 + G3;
	float x2 = x0 - i2 + 2.0*G3; // Offsets for third corner in (x,y,z) coords
	float y2 = y0 - j2 + 2.0*G3;
	float z2 = z0 - k2 + 2.0*G3;
	float x3 = x0 - 1.0 + 3.0*G3; // Offsets for last corner in (x,y,z) coords
	float y3 = y0 - 1.0 + 3.0*G3;
	float z3 = z0 - 1.0 + 3.0*G3;
	
	// Work out the hashed gradient indices of the four simplex corners
	int ii = i & 255;
	int jj = j & 255;
	int kk = k & 255;
	int gi0 = perm[ii+perm[jj+perm[kk]]] % 12;
	int gi1 = perm[ii+i1+perm[jj+j1+perm[kk+k1]]] % 12;
	int gi2 = perm[ii+i2+perm[jj+j2+perm[kk+k2]]] % 12;
	int gi3 = perm[ii+1+perm[jj+1+perm[kk+1]]] % 12;
	
	// Calculate the contribution from the four corners
	float t0 = 0.5 - x0*x0 - y0*y0 - z0*z0;
	if(t0<0){
		n0 = 0.0;
	}else{
		t0 *= t0;
		n0 = t0 * t0 * dot(grad3[gi0], vec3(x0, y0, z0));
	}
	
	float t1 = 0.5 - x1*x1 - y1*y1 - z1*z1;
	if(t1<0){
		n1 = 0.0;
	}else{
		t1 *= t1;
		n1 = t1 * t1 * dot(grad3[gi1], vec3(x1, y1, z1));
	}
	
	float t2 = 0.5 - x2*x2 - y2*y2 - z2*z2;
	if(t2<0){
		n2 = 0.0;
	}else{
		t2 *= t2;
		n2 = t2 * t2 * dot(grad3[gi2], vec3(x2, y2, z2));
	}
	
	float t3 = 0.5 - x3*x3 - y3*y3 - z3*z3;
	if(t3<0){
		n3 = 0.0;
	}else{
		t3 *= t3;
		n3 = t3 * t3 * dot(grad3[gi3], vec3(x3, y3, z3));
	}
	
	/********************
	Sum up and scale the result to cover the range [-1,1]
	
	sj note
		sampleの係数(32.0)だと、振幅が小さく、グレーに白っちゃけて見えた(cf:GLSL_Tuned)。
		実験的に、GLSL_Tunedと同じ見た目になるよう、係数を調整.
	********************/
	// return 32.0*(n0 + n1 + n2 + n3);
	return 60.0*(n0 + n1 + n2 + n3);
}

/******************************
******************************/
float snoise(vec4 v)
{
	float F4 = (sqrt(5.0)-1.0)/4.0;
	float G4 = (5.0 - sqrt(5.0))/20.0;
	
	float n0, n1, n2, n3, n4; // Noise contributions from the five corners

	float s = (v.x + v.y + v.z + v.w) * F4;
	int i = int(floor(v.x + s));
	int j = int(floor(v.y + s));
	int k = int(floor(v.z + s));
	int l = int(floor(v.w + s));
	
	float t = (i + j + k + l) * G4;
	float X0 = i - t;
	float Y0 = j - t;
	float Z0 = k - t;
	float W0 = l - t;
	float x0 = v.x - X0;
	float y0 = v.y - Y0;
	float z0 = v.z - Z0;
	float w0 = v.w - W0;
	
	int c1 = (x0 > y0) ? 32 : 0;
	int c2 = (x0 > z0) ? 16 : 0;
	int c3 = (y0 > z0) ? 8 : 0;
	int c4 = (x0 > w0) ? 4 : 0;
	int c5 = (y0 > w0) ? 2 : 0;
	int c6 = (z0 > w0) ? 1 : 0;
	int c = c1 + c2 + c3 + c4 + c5 + c6;
	
	int i1, j1, k1, l1; // The integer offsets for the second simplex corner
	int i2, j2, k2, l2; // The integer offsets for the third simplex corner
	int i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
	// 
	i1 = simplex[c][0]>=3 ? 1 : 0;
	j1 = simplex[c][1]>=3 ? 1 : 0;
	k1 = simplex[c][2]>=3 ? 1 : 0;
	l1 = simplex[c][3]>=3 ? 1 : 0;
	
	// 
	i2 = simplex[c][0]>=2 ? 1 : 0;
	j2 = simplex[c][1]>=2 ? 1 : 0;
	k2 = simplex[c][2]>=2 ? 1 : 0;
	l2 = simplex[c][3]>=2 ? 1 : 0;
	
	// 
	i3 = simplex[c][0]>=1 ? 1 : 0;
	j3 = simplex[c][1]>=1 ? 1 : 0;
	k3 = simplex[c][2]>=1 ? 1 : 0;
	l3 = simplex[c][3]>=1 ? 1 : 0;


	float x1 = x0 - i1 + G4;		// Offsets for second corner in (x,y,z,w) coords
	float y1 = y0 - j1 + G4;
	float z1 = z0 - k1 + G4;
	float w1 = w0 - l1 + G4;
	float x2 = x0 - i2 + 2.0*G4;	// Offsets for third corner in (x,y,z,w) coords
	float y2 = y0 - j2 + 2.0*G4;
	float z2 = z0 - k2 + 2.0*G4;
	float w2 = w0 - l2 + 2.0*G4;
	float x3 = x0 - i3 + 3.0*G4;	// Offsets for fourth corner in (x,y,z,w) coords
	float y3 = y0 - j3 + 3.0*G4;
	float z3 = z0 - k3 + 3.0*G4;
	float w3 = w0 - l3 + 3.0*G4;
	float x4 = x0 - 1.0 + 4.0*G4;	// Offsets for last corner in (x,y,z,w) coords
	float y4 = y0 - 1.0 + 4.0*G4;
	float z4 = z0 - 1.0 + 4.0*G4;
	float w4 = w0 - 1.0 + 4.0*G4;
	
	// Work out the hashed gradient indices of the five simplex corners
	int ii = i & 255;
	int jj = j & 255;
	int kk = k & 255;
	int ll = l & 255;
	int gi0 = perm[ii+perm[jj+perm[kk+perm[ll]]]] % 32;
	int gi1 = perm[ii+i1+perm[jj+j1+perm[kk+k1+perm[ll+l1]]]] % 32;
	int gi2 = perm[ii+i2+perm[jj+j2+perm[kk+k2+perm[ll+l2]]]] % 32;
	int gi3 = perm[ii+i3+perm[jj+j3+perm[kk+k3+perm[ll+l3]]]] % 32;
	int gi4 = perm[ii+1+perm[jj+1+perm[kk+1+perm[ll+1]]]] % 32;
	
	// Calculate the contribution from the five corners
	float t0 = 0.5 - x0*x0 - y0*y0 - z0*z0 - w0*w0;
	if(t0<0){
		n0 = 0.0;
	}else{
		t0 *= t0;
		n0 = t0 * t0 * dot(grad4[gi0], vec4(x0, y0, z0, w0));
	}
	
	float t1 = 0.5 - x1*x1 - y1*y1 - z1*z1 - w1*w1;
	if(t1<0){
		n1 = 0.0;
	}else{
		t1 *= t1;
		n1 = t1 * t1 * dot(grad4[gi1], vec4(x1, y1, z1, w1));
	}
	
	float t2 = 0.5 - x2*x2 - y2*y2 - z2*z2 - w2*w2;
	if(t2<0){
		n2 = 0.0;
	}else{
		t2 *= t2;
		n2 = t2 * t2 * dot(grad4[gi2], vec4(x2, y2, z2, w2));
	}
	
	float t3 = 0.5 - x3*x3 - y3*y3 - z3*z3 - w3*w3;
	if(t3<0){
		n3 = 0.0;
	}else{
		t3 *= t3;
		n3 = t3 * t3 * dot(grad4[gi3], vec4(x3, y3, z3, w3));
	}
	
	float t4 = 0.5 - x4*x4 - y4*y4 - z4*z4 - w4*w4;
	if(t4<0){
		n4 = 0.0;
	}else{
		t4 *= t4;
		n4 = t4 * t4 * dot(grad4[gi4], vec4(x4, y4, z4, w4));
	}
	
	/********************
	Sum up and scale the result to cover the range [-1,1]
	
	sj note
		sampleの係数(27.0)だと、振幅が小さく、グレーに白っちゃけて見えた(cf:GLSL_Tuned)。
		実験的に、GLSL_Tunedと同じ見た目になるよう、係数を調整.
	********************/
	// return 27.0 * (n0 + n1 + n2 + n3 + n4);
	return 56. * (n0 + n1 + n2 + n3 + n4);
}

