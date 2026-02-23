import MaskedView from '@react-native-masked-view/masked-view';
import { useFonts } from "expo-font";
import { LinearGradient } from 'expo-linear-gradient';
import { PermissionManager } from '@/services/PermissionsManager';
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert, Animated, Easing, FlatList, Image, StatusBar,
    StyleSheet, Text, TouchableOpacity, useWindowDimensions,
    View, ViewToken
} from 'react-native';


// --- 1. CONFIGURATION & ASSETS ---
const LOGO_IMAGE = require('@/assets/images/Onboarding/karela_logo.png');

const THEME = {
    background: '#0F0F0F',
    primary: '#7CF205',
    secondary: '#209F77',
    text: '#FFFFFF',
    textDim: '#A1A1AA',
};

const SLIDES = [
    { id: '1', title: 'Your journey starts\nwith one step.', description: 'The hardest part is showing up. Let us handle the rest.', image: LOGO_IMAGE },
    { id: '2', title: 'Run Smarter,\nRun Stronger', description: 'Get personalized coaching plans adapted to your performance.', image: require('@/assets/images/Onboarding/slide2.png') },
    { id: '3', title: 'Track Every Step', description: 'Real-time stats and GPS tracking to keep you on pace.', image: require('@/assets/images/Onboarding/slide3.png') },
    { id: '4', title: 'Set Goals\nSee Progress', description: 'Visualize your improvements and smash your personal bests.', image: require('@/assets/images/Onboarding/slide4.png') },
    { id: '5', title: 'Run With\nConfidence', description: 'Route planning and safety features for peace of mind.', image: require('@/assets/images/Onboarding/slide5.png') },
    { id: '6', title: 'Ready To\nRun?', description: 'Enable location services to accurately track your runs.', image: require('@/assets/images/Onboarding/slide6.png') },
];

// --- 2. HELPER COMPONENTS ---

const BackgroundGradients = () => (
    <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
            colors={['rgba(32, 159, 119, 0.08)', 'rgba(15, 15, 15, 1)', 'rgba(124, 242, 5, 0.05)']}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
    </View>
);

const GradientText = ({ text, style }: { text: string, style?: any }) => (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{text}</Text>}>
        <LinearGradient colors={['#FFFFFF', '#7CF205']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
            <Text style={[style, { opacity: 0 }]}>{text}</Text>
        </LinearGradient>
    </MaskedView>
);

const CustomSplashScreen = ({ onFinish }: { onFinish: () => void }) => {
    const progress = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.timing(progress, { toValue: 1, duration: 2500, useNativeDriver: false, easing: Easing.out(Easing.ease) }).start(() => {
            Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => onFinish());
        });
    }, []);

    const widthInterp = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
        <Animated.View style={[styles.splashContainer, { opacity }]}>
            <View style={styles.splashLogoContainer}>
                <Image source={LOGO_IMAGE} style={styles.splashLogo} />
            </View>
            <View style={styles.loadingBarTrack}>
                <Animated.View style={[styles.loadingBarFill, { width: widthInterp }]} />
            </View>
        </Animated.View>
    );
};

// --- 3. MAIN COMPONENT ---

export default function Index() {
    const router = useRouter();
    const { width } = useWindowDimensions();

    // State
    const [showSplash, setShowSplash] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Animated Refs
    const scrollX = useRef(new Animated.Value(0)).current;
    const morphAnim = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);

    const [fontsLoaded] = useFonts({
        "Excon-Thin": require("@/assets/fonts/Excon-Thin.otf"),
        "Excon-Regular": require("@/assets/fonts/Excon-Regular.otf"),
        "Excon-Bold": require("@/assets/fonts/Excon-Bold.otf"),
        "Excon-Black": require("@/assets/fonts/Excon-Black.otf"),
    });

    // Handle Button Morph Effect
    useEffect(() => {
        Animated.spring(morphAnim, {
            toValue: currentIndex === SLIDES.length - 1 ? 1 : 0,
            useNativeDriver: false,
            friction: 8,
            tension: 40
        }).start();
    }, [currentIndex]);

    const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems?.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const scrollToNext = async () => {
        // 1. If we aren't on the last slide, just scroll forward
        if (currentIndex < SLIDES.length - 1) {
            slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
            return; 
        } 

        // 2. We are on the last slide. Use your PermissionManager!
        const hasPermission = await PermissionManager.requestLocation();

        if (hasPermission) {
            // Success: The user said 'Allow'
            router.push("/auth/login");
        } else {
            // Fail: The user said 'Deny'. 
            // Your PermissionManager already showed the Alert with the 'Settings' button.
            console.log("Permission denied by user.");
        }
    };

    if (!fontsLoaded) return null;
    if (showSplash) return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="light-content" />
            <BackgroundGradients />

            {/* SLIDES LIST */}
            <View style={{ flex: 3 }}>
                <FlatList
                    data={SLIDES}
                    ref={slidesRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                    onViewableItemsChanged={viewableItemsChanged}
                    viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                    renderItem={({ item }) => (
                        <View style={[styles.itemContainer, { width }]}>
                            <View style={styles.imageContainer}>
                                <Image source={item.image} style={[styles.image, { width: width * 0.9 }]} />
                            </View>
                            <View style={styles.textContainer}>
                                <View style={styles.titleWrapper}>
                                    <GradientText text={item.title} style={styles.title} />
                                </View>
                                <Text style={styles.description}>{item.description}</Text>
                            </View>
                        </View>
                    )}
                />
            </View>

            {/* PAGINATOR DOTS */}
            <View style={styles.paginatorContainer}>
                {SLIDES.map((_, i) => {
                    const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                    const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 32, 8], extrapolate: 'clamp' });
                    const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
                    return <Animated.View key={i.toString()} style={[styles.dot, { width: dotWidth, opacity }]} />;
                })}
            </View>

            {/* FOOTER ACTIONS */}
            <View style={styles.footer}>
                <View style={styles.footerRow}>
                    {/* Skip Button */}
                    <Animated.View style={[styles.skipContainer, {
                        opacity: morphAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: 'clamp' })
                    }]}>
                        <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Next / Access Button */}
                    <View style={styles.centerWrapper}>
                        <Animated.View style={[styles.morphedButtonContainer, {
                            width: morphAnim.interpolate({ inputRange: [0, 1], outputRange: [120, width - 60] }),
                            transform: [{
                                translateX: morphAnim.interpolate({ inputRange: [0, 1], outputRange: [width / 2 - 90, 0] })
                            }]
                        }]}>
                            <TouchableOpacity style={styles.primaryButtonFill} onPress={scrollToNext} activeOpacity={0.8}>
                                <View style={styles.buttonTextWrapper}>
                                    <Animated.Text style={[styles.primaryButtonText, {
                                        opacity: morphAnim.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0] }),
                                        position: 'absolute'
                                    }]}>Next</Animated.Text>
                                    <Animated.Text style={[styles.primaryButtonText, {
                                        opacity: morphAnim.interpolate({ inputRange: [0.7, 1], outputRange: [0, 1] })
                                    }]}>Allow Access</Animated.Text>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </View>
        </View>
    );
}

// --- 4. STYLES ---

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    splashContainer: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 100, alignItems: 'center', justifyContent: 'center' },
    splashLogo: { width: 120, height: 120, resizeMode: 'contain' },
    splashLogoContainer: { flex: 1, justifyContent: 'center' },
    loadingBarTrack: { width: '60%', height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 100, overflow: 'hidden' },
    loadingBarFill: { height: '100%', backgroundColor: '#FFF' },
    itemContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageContainer: { flex: 0.6, justifyContent: 'center', alignItems: 'center' },
    image: { height: '65%', resizeMode: 'contain' },
    textContainer: { flex: 0.4, width: '85%', alignItems: 'center' },
    titleWrapper: { height: 100, width: '100%', alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: 'Excon-Black', fontSize: 28, textAlign: 'center', lineHeight: 34 },
    description: { fontFamily: 'Excon-Regular', fontSize: 16, color: THEME.textDim, textAlign: 'center', paddingHorizontal: 20, lineHeight: 24 },
    paginatorContainer: { flexDirection: 'row', height: 40, justifyContent: 'center', alignItems: 'center' },
    dot: { height: 6, borderRadius: 4, backgroundColor: THEME.primary, marginHorizontal: 4 },
    footer: { height: 120, width: '100%', justifyContent: 'center' },
    footerRow: { width: '100%', height: 60, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30 },
    skipContainer: { position: 'absolute', left: 30, zIndex: 2 },
    centerWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    skipButton: { padding: 10 },
    skipText: { color: THEME.textDim, fontFamily: 'Excon-Bold', fontSize: 16 },
    morphedButtonContainer: { height: 56, backgroundColor: THEME.primary, borderRadius: 28, overflow: 'hidden' },
    primaryButtonFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    buttonTextWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%' },
    primaryButtonText: { color: '#000', fontFamily: 'Excon-Bold', fontSize: 16 },
});