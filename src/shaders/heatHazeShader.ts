export const heatHazeVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const heatHazeFragmentShader = `
  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform vec3 uAnimalPositions[3];
  uniform float uAnimalIntensities[3];
  uniform int uActiveAnimalCount;
  uniform vec3 uCameraDirection;
  
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  
  // Fonction pour calculer la distance angulaire entre deux vecteurs normalisés
  float angleBetween(vec3 a, vec3 b) {
    return acos(clamp(dot(a, b), -1.0, 1.0));
  }
  
  // Fonction de déformation heat haze
  vec2 heatHazeDistortion(vec2 uv, vec3 animalPos, float intensity, float time) {
    // Convertir la position de l'animal en coordonnées UV sphériques
    vec3 normalizedAnimalPos = normalize(animalPos);
    
    // Calculer l'angle entre la direction de la caméra et l'animal
    float angle = angleBetween(normalize(uCameraDirection), normalizedAnimalPos);
    float maxAngle = radians(90.0); // Zone d'effet de 90°
    
    // Atténuation basée sur l'angle (plus proche = plus fort)
    float angularFalloff = 1.0 - clamp(angle / maxAngle, 0.0, 1.0);
    angularFalloff = pow(angularFalloff, 2.0); // Courbe quadratique
    
    // Distance du fragment à l'animal (en coordonnées UV)
    vec2 animalUV = vec2(
      atan(normalizedAnimalPos.z, normalizedAnimalPos.x) / (2.0 * 3.14159) + 0.5,
      acos(normalizedAnimalPos.y) / 3.14159
    );
    
    vec2 distanceFromAnimal = uv - animalUV;
    float distance = length(distanceFromAnimal);
    
    // Zone d'effet local autour de l'animal
    float localRadius = 0.15; // Rayon d'effet en coordonnées UV
    float localFalloff = 1.0 - clamp(distance / localRadius, 0.0, 1.0);
    localFalloff = pow(localFalloff, 1.5);
    
    // Combinaison des deux falloffs
    float totalIntensity = intensity * angularFalloff * localFalloff;
    
    if (totalIntensity <= 0.001) return vec2(0.0);
    
    // Génération de l'effet heat haze
    float wave1 = sin(time * 2.0 + distance * 20.0) * 0.5 + 0.5;
    float wave2 = sin(time * 1.5 + distance * 15.0 + 1.57) * 0.5 + 0.5;
    float wave3 = sin(time * 3.0 + distance * 25.0 + 3.14) * 0.5 + 0.5;
    
    // Combinaison des ondes pour un effet organique
    float wavePattern = (wave1 + wave2 * 0.7 + wave3 * 0.5) / 2.2;
    
    // Déformation verticale principalement (heat haze monte)
    vec2 distortion = vec2(
      sin(wavePattern * 6.28) * 0.003,
      sin(wavePattern * 6.28 + 1.57) * 0.008
    ) * totalIntensity;
    
    return distortion;
  }
  
  void main() {
    // TEST BASIQUE: tout en rouge pour voir si le shader fonctionne
    vec3 baseColor = vec3(1.0, 0.0, 0.0); // Rouge pur
    
    // Si on a une texture, l'utiliser
    if (tDiffuse != sampler2D(0)) {
      vec4 textureColor = texture2D(tDiffuse, vUv);
      baseColor = textureColor.rgb;
    }
    
    // Petit cercle bleu pulsant au centre pour vérifier l'animation
    vec2 center = vec2(0.5, 0.5);
    float distanceFromCenter = length(vUv - center);
    float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
    
    if (distanceFromCenter < 0.1) {
      baseColor = mix(baseColor, vec3(0.0, 0.0, 1.0), 0.8 * pulse);
    }
    
    // Quadrant en vert pour vérifier les coordonnées UV
    if (vUv.x < 0.5 && vUv.y < 0.5) {
      baseColor = mix(baseColor, vec3(0.0, 1.0, 0.0), 0.3);
    }
    
    gl_FragColor = vec4(baseColor, 1.0);
  }
`;