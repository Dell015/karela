import { StyleSheet } from 'react-native';

export const theme = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'flex-end',
    paddingBottom: 60,
  },
  logo: {
    width: 100,
    height: 60,
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 42,
    fontFamily: 'Excon-Bold',
    lineHeight: 50,
  },
  headlinehighlight: {
    color: '#7CF205',
    textShadowColor: '#209F77',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  subtext: {
    color: '#A0A0A0',
    fontSize: 18,
    fontFamily: 'Excon-Regular',
    marginTop: 15,
    lineHeight: 26,
  },
  pagination: {
    flexDirection: 'row',
    marginVertical: 30,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444',
    marginRight: 8,
  },
  activeDot: {
    backgroundColor: '#7CF205',
    width: 20,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Excon-Bold',
  },
  skipButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Excon-Medium',
  },
});