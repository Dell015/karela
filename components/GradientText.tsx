import React from 'react';
import { Text, TextStyle, StyleProp, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

export const GradientText = ({ text, style }: { text: string; style?: StyleProp<TextStyle> }) => {
  return (
    <View style={{ height: 55 }}> 
      <MaskedView
        maskElement={
          <Text style={[style, { backgroundColor: 'transparent' }]}>
            {text}
          </Text>
        }
      >
        <LinearGradient 
          colors={['#7CF205', '#209F77']} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }}
        >
          <Text style={[style, { opacity: 0 }]}>{text}</Text>
        </LinearGradient>
      </MaskedView>
    </View>
  );
};