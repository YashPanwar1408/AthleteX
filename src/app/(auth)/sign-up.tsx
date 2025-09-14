import * as React from 'react'
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp()
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false);
    const [emailAddress, setEmailAddress] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [pendingVerification, setPendingVerification] = React.useState(false)
    const [code, setCode] = React.useState('')

    // Password validation function
    const isPasswordValid = (pass: string) => {
        const minLength = 8;
        const hasNumber = /\d/.test(pass);
        const hasLetter = /[a-zA-Z]/.test(pass);
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);

        return pass.length >= minLength && hasNumber && hasLetter && hasSymbol;
    }

    // Handle submission of sign-up form
    const onSignUpPress = async () => {
        if (!isLoaded) return;
        
        if(!emailAddress || !password){
            Alert.alert("Error", "Please enter both email and password");
            return;
        }

        if (!isPasswordValid(password)) {
            Alert.alert(
                "Invalid Password", 
                "Password must be at least 8 characters and include numbers, letters, and symbols"
            );
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            // Start sign-up process using email and password provided
            const signUpAttempt = await signUp.create({
                emailAddress,
                password,
            });

            if (signUpAttempt.status !== "complete") {
                // Send email verification code
                await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
                setPendingVerification(true);
            }
        } catch (err: any) {
            // Handle specific error cases
            if (err.errors && err.errors[0]) {
                Alert.alert("Error", err.errors[0].message);
            } else {
                Alert.alert("Error", "An error occurred during sign up. Please try again.");
            }
            console.error(JSON.stringify(err, null, 2));
        } finally {
            setIsLoading(false);
        }
    }

    // Handle submission of verification form
    const onVerifyPress = async () => {
        if (!isLoaded) return;

        if(!code){
            Alert.alert("Error", "Please enter the verification code sent to your email");
            return;
        }

        setIsLoading(true);

        try {
            // Attempt to verify the email address using the code
            const signUpAttempt = await signUp.attemptEmailAddressVerification({
                code,
            });

            if (signUpAttempt.status === 'complete') {
                // Set the session as active
                await setActive({ session: signUpAttempt.createdSessionId });
                // Redirect to selection screen after successful verification
                router.replace('/(selection)');
            } else {
                Alert.alert(
                    "Verification Failed", 
                    "Please check your code and try again."
                );
                console.error(JSON.stringify(signUpAttempt, null, 2));
            }
        } catch (err: any) {
            if (err.errors && err.errors[0]) {
                Alert.alert("Verification Error", err.errors[0].message);
            } else {
                Alert.alert(
                    "Error", 
                    "Failed to verify email. Please check your code and try again."
                );
            }
            console.error(JSON.stringify(err, null, 2));
        } finally {
            setIsLoading(false);
        }
    }

    if (pendingVerification) {
        return (
            <SafeAreaView className='flex-1 bg-gray-50'>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
                    <View className='flex-1 px-6'>
                        <View className='flex-1 justify-center'>
                            {/*Logo/Branding*/}
                            <View className='items-center mb-8'>
                                <View className='bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg'>
                                    <Ionicons name="mail" size={40} color="white" />
                                </View>
                                <Text className='text-3xl font-bold text-gray-900 mb-2'>
                                    Check Your Email
                                </Text>
                                <Text className='text-lg text-gray-600 text-center'>
                                    We've sent a verification code to{"\n"}{emailAddress}
                                </Text>
                            </View>
                            {/*Verification Form*/}
                            <View className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6'>
                                <Text className='text-2xl font-bold mb-4 text-gray-900 text-center'>
                                    Enter Verification Code
                                </Text>
                            {/*Code Input*/}
                                <View className='mb-6'>
                                    <Text className='text-sm font-medium text-gray-700 mb-2'>
                                        Verification Code
                                    </Text>
                                    <View className='flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200'>
                                        <Ionicons name="key-outline" size={20} color="#6B7280" />
                                        <TextInput
                                            value={code}
                                            placeholder="Enter 6-digit code"
                                            placeholderTextColor="#9CA3AF"
                                            onChangeText={setCode}
                                            className='flex-1 ml-3 text-gray-900 text-center text-lg tracking-widest'
                                            keyboardType='number-pad'
                                            maxLength={6}
                                            editable={!isLoading}
                                        />
                                    </View>
                                </View>
                                {/*Verify Button*/}
                                <TouchableOpacity
                                    onPress={onVerifyPress}
                                    disabled={isLoading}
                                    className={`rounded-xl py-4 shadow-sm mb-4 ${isLoading ? 'bg-gray-400' : 'bg-green-600'}`}
                                    activeOpacity={0.8}
                                >
                                    <View className='flex-row items-center justify-center'>
                                        {isLoading ? (
                                            <Ionicons name='refresh' size={20} color='white' />
                                        ) : (
                                            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                                        )}
                                        <Text className='text-white text-lg font-semibold ml-2'>
                                            {isLoading ? 'Verifying...' : 'Verify Email'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {/*Resend Code*/}
                                <View className='flex-row justify-center'>
                                    <Text className='text-gray-600'>Didn't receive the code? </Text>
                                    <TouchableOpacity onPress={onSignUpPress} disabled={isLoading}>
                                        <Text className='text-blue-600 font-medium'>Resend</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        {/*Footer*/}
                        <View className='pb-6'>
                            <Text className='text-center text-gray-500 text-sm'>
                                Almost there! Just one more step
                            </Text>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className='flex-1 bg-gray-50'>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1'>
                <View className='flex-1 px-6'>
                    {/*Main*/}
                    <View className='flex-1 justify-center'>
                        {/*Logo/Branding*/}
                        <View className='items-center mb-8'>
                            <View className='bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg'>
                                <Ionicons name="fitness" size={40} color="red" />
                            </View>
                            <Text className='text-3xl font-bold text-gray-900 mb-2'>
                                Join AtheleteX
                            </Text>
                            <Text className='text-lg text-gray-600 text-center'>
                                Start your fitness journey{"\n"}and achieve your goals
                            </Text>
                        </View>
                        {/*Sign Up Form*/}
                        <View className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6'>
                            <Text className='text-2xl font-bold mb-4 text-gray-900 text-center'>
                                Create Your Account
                            </Text>
                            {/*Email Input*/}
                            <View className='mb-4'>
                                <Text className='text-sm font-medium text-gray-700 mb-2'>
                                    Email
                                </Text>
                                <View className='flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200'>
                                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        autoCapitalize='none'
                                        value={emailAddress}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={setEmailAddress}
                                        className='flex-1 ml-3 text-gray-900'
                                        editable={!isLoading}
                                    />
                                </View>
                            </View>
                            {/*Password Input*/}
                            <View className='mb-6'>
                                <Text className='text-sm font-medium text-gray-700 mb-2'>
                                    Password
                                </Text>
                                <View className='flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200'>
                                    <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                                    <TextInput
                                        value={password}
                                        placeholder="Create a password"
                                        placeholderTextColor="#9CA3AF"
                                        onChangeText={setPassword}
                                        className='flex-1 ml-3 text-gray-900'
                                        editable={!isLoading}
                                        secureTextEntry={true}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        textContentType="newPassword"
                                        keyboardType="ascii-capable"
                                    />
                                </View>
                                <Text className='text-xs text-gray-500 mt-1'>
                                    Password must be at least 8 characters and include numbers, letters, and symbols
                                </Text>
                            </View>
                            {/*Sign Up Button*/}
                            <TouchableOpacity
                                onPress={onSignUpPress}
                                disabled={isLoading}
                                className={`rounded-xl py-4 shadow-sm mb-4 ${isLoading ? 'bg-gray-400' : 'bg-blue-600'}`}
                                activeOpacity={0.8}
                            >
                                <View className='flex-row items-center justify-center'>
                                    {isLoading ? (
                                        <Ionicons name='refresh' size={20} color='white' />
                                    ) : (
                                        <Ionicons name="person-add-outline" size={20} color="white" />
                                    )}
                                    <Text className='text-white text-lg font-semibold ml-2'>
                                        {isLoading ? 'Creating Account...' : 'Create Account'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            {/*Terms*/}
                            <Text className='text-xs text-gray-500 text-center mb-4'>
                                By signing up, you agree to our Terms of Service and Privacy Policy.
                            </Text>
                        </View>
                        {/*Sign In Link*/}
                        <View className='flex-row items-center justify-center'>
                            <Text className='text-gray-600'>Already have an account? </Text>
                            <Link href="/sign-in" asChild>
                                <TouchableOpacity>
                                    <Text className='text-blue-600 font-medium'>Sign in</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                    {/*Footer*/}
                    <View className='pb-6'>
                        <Text className='text-center text-gray-500 text-sm'>
                            Ready to transform your fitness?
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}