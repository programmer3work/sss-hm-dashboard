"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const ssoRole = sessionStorage.getItem("userRole");

    //if (!token && ssoRole !== "Headmaster") {
     //window.location.href = "https://staging.sss.swais.in";
    //}
  }, []);
}