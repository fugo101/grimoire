import { useTranslations } from "next-intl";
import { CenteredMessage } from "@/components/centered-message";

export default function NotFound() {
  const t = useTranslations("app.notFound");
  return (
    <CenteredMessage title={t("title")}>{t("description")}</CenteredMessage>
  );
}
