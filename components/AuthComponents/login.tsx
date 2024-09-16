"use client";
import { Badge, Button, Card, Flex, Strong, Text, TextField } from "@radix-ui/themes";
import { EnvelopeClosedIcon, EyeClosedIcon, EyeOpenIcon, LockClosedIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { login } from "@/types/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Login = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<any>({
    email: false,
    password: false,
    credentials: false,
  });
  const [form, setForm] = useState<login>({
    email: "",
    password: "",
  });
  const handleError = (field: string) => error[field];

  async function onSubmit(e: any) {
    e.preventDefault();
    setLoading(true);
    setError({ ...error, email: !form.email, password: !form.password, credentials: false });
    if (!form.email || !form.password) {
      setLoading(false);
      return;
    }

    const SignInResponse = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false
    });
    
    if (SignInResponse && !SignInResponse.error) {
      router.push(`/dashboard`);
      setLoading(false);
    } else {
      setError({ ...error, credentials: true });
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center pt-[20px]">
      <Card className="sm:w-[90%] md:w-[400px] lg:w-[480px] overflow-auto drop-shadow-2xl">
        <Flex className="flex flex-col items-center justify-center gap-[25px] p-[30px]">
          <Card className="my-[20px]">
          <svg
          className="w-auto h-6 fill-current"
          viewBox="0 0 194 116"
          xmlns="http://www.w3.org/2000/svg"
          >
          <g fillRule="evenodd">
            <path d="M96.869 0L30 116h104l-9.88-17.134H59.64l47.109-81.736zM0 116h19.831L77 17.135 67.088 0z" />
            <path d="M87 68.732l9.926 17.143 29.893-51.59L174.15 116H194L126.817 0z" />
          </g>
        </svg>
          </Card>


          {/* Email Field */}
          <Flex direction={"column"} gap={"2"} className="w-full max-w-[250px]">
            <Text size={"2"}>Email</Text>
            <TextField.Root
              placeholder={handleError("email") ? "Email required" : "Email"}
              color={handleError("email") && "red"}
              variant={handleError("email") && "soft"}
              onChange={(e: any) => {
                setForm({ ...form, email: e.target.value });
              }}
              value={form.email}
              type="email"
              className="w-full"
            >
              <TextField.Slot side="left">
                <EnvelopeClosedIcon />
              </TextField.Slot>
            </TextField.Root>
          </Flex>

          {/* Password Field */}
          <Flex direction={"column"} gap={"2"} className="w-full max-w-[250px]">
            <Text size={"2"}>Password</Text>
            <TextField.Root
              onChange={(e: any) => {
                setForm({ ...form, password: e.target.value });
              }}
              value={form.password}
              type={showPassword ? "text" : "password"}
              className="w-full"
              placeholder={
                handleError("password") ? "Password required" : "Password"
              }
              color={handleError("password") && "red"}
              variant={handleError("password") && "soft"}
            >
              <TextField.Slot>
                <LockClosedIcon />
              </TextField.Slot>
              <TextField.Slot style={{ cursor: "pointer" }} side="right">
                {showPassword ? (
                  <EyeOpenIcon onClick={() => setShowPassword(false)} />
                ) : (
                  <EyeClosedIcon onClick={() => setShowPassword(true)} />
                )}
              </TextField.Slot>
            </TextField.Root>
          </Flex>

          {error.credentials && (
            <Badge size={"2"} variant="outline" color="red">
              Invalid Credentials
            </Badge>
          )}

          {/* Login Button */}
          <Button
            loading={loading}
            style={{ width: "250px", maxWidth: "100%", cursor: "pointer" }}
            onClick={onSubmit}
          >
            Continue
          </Button>

          <Link href={'/reset_password'}>
            <Text size={'1'} style={{ fontWeight: '500' }}>Forget Password ?</Text>
          </Link>

          {/* Line */}
          <Flex direction={"row"} className="items-center justify-center">
            <span
              style={{
                border: "1px solid",
                width: "60px",
                height: "0px",
                opacity: "20%",
              }}
            ></span>
            <Text size={"1"} className="px-[10px]">
              OR
            </Text>
            <span
              style={{
                border: "1px solid",
                width: "60px",
                height: "0px",
                opacity: "20%",
              }}
            ></span>
          </Flex>

          {/* Login through socials */}
          <Flex direction={"column"} gap={"4"}>
            <Button
              variant={"surface"}
              style={{ width: "250px", maxWidth: "100%", cursor: "pointer" }}
              onClick={async () => {
                const usr = await signIn("google", {
                  callbackUrl: '/'
                });
                
              }}
            >
              <Image src={"/google.png"} width={20} height={20} alt="google" />
              Continue with Google
            </Button>
            {/** 
             * 
             <Button
             variant={"surface"}
             style={{ width: "250px", cursor: "pointer" }}
             >
             <Image
             src={"/facebook.png"}
             width={20}
             height={20}
             alt="facebook"
             />
             Continue with Facebook
             </Button>
            */}
          </Flex>

          {/* Go To Sign Up */}
          <Text size={"1"}>
            Don&apos;t have an account ?{" "}
            <Link href={"/sign-up"}>
              <Strong style={{ cursor: "pointer" }}>Sign up</Strong>.
            </Link>
          </Text>
        </Flex>
      </Card>
    </div>
  );
};

export default Login;